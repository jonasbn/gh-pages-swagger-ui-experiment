# gh-pages-swagger-ui-experiment

This is an experiment of hosting the Swagger-UI as GH pages, so it can be used to display Swagger documentation for APIs for a repository containing the OpenAPI/Swagger definition iself.

The repository is structured as follows:

- `api-docs` - directory containing the Swagger-UI ([demo](api-docs/))
- `swagger.json` - the OpenAPI/Swagger definition
- `README.md` - this file (documentation describing the experiment)

## Recipe

When the repository was set up the following steps were taken:

First a directory for the Swagger-UI was created:

```bash
mkdir api-docs
```

The Swagger-UI was downloaded and the relevant files where extracted into the `api-docs` directory:

```bash
curl -X GET https://github.com/swagger-api/swagger-ui/releases/tag/v5.17.14
```

Do note the version number was the one available at the time of the experiment, do fetch the newest version available.

The files are unpacked:

```bash
tar xvzf swagger-ui-5.17.14.tar.gz
```

The files are copied to the `api-docs/` directory created above:

```bash
cd swagger-ui-5.17.14
cd dist # navigate to the dist directory
cp -r . ../../api-docs # copy the files to the api-docs directory recursively
cd ../../ # skip back to the root of the repository
```

You can all the directory what you want. The name `api-docs` is just a suggestion.

The `dist/` directory contains the Swagger-UI files, which can be used to serve the Swagger documentation as a static site.

From the [documentation][SWAGGERUI] (see: "Plain old HTML/CSS/JS (Standalone)" section):

> Open swagger-initializer.js in your text editor and replace "https://petstore.swagger.io/v2/swagger.json" with the URL for your OpenAPI 3.0 spec.

Since I do not have anything sharable at the moment, I will use the Swagger Petstore example:

But to demonstrate that it is possible to use a local file, I will use the `swagger.json` file in the repository.

First we dowmload the referenced file:

```bash
curl -X GET -o swagger.json https://petstore.swagger.io/v2/swagger.json
```

We edit the `swagger-initializer.js` file and add the path to the `swagger.json` file:

```javascript
url: "../swagger.json",
```

Since we can [serve multiple API definitions][MULTIPLE], we can add multiple URLs to the `urls` array in the `swagger-initializer.js` file:

```javascript
    urls: [
      {
        url: "../swagger.json",
        name: "The local file from the repository"
      },
      {
        url: "https://jonasbn.github.io/gh-pages-swagger-ui-experiment/swagger.json",
        name: "The local Swagger Petstore"
      },
      {
        url: "https://petstore.swagger.io/v2/swagger.json",
        name: "The original Swagger Petstore"
      },
    ],
```

REF:

- https://github.com/jonasbn/gh-pages-swagger-ui-experiment/blob/main/api-docs/swagger-initializer.js

The file is with the definition is also served from GitHub pages as: `https://jonasbn.github.io/gh-pages-swagger-ui-experiment/swagger.json`, so it is easy to consume for clients etc.

When the changes have been committed and pushed and the , the Swagger-UI can be accessed using the following URL:

- https://jonasbn.github.io/gh-pages-swagger-ui-experiment/api-docs/

So now we serve the Swagger-UI as a static site using GH pages.

Do note GitHub pages have been enabled for the repository.

It works as expected and is fetching the `swagger.json` file from the repository in addition to the remote file and the file we service our selves, just as a proof of concept.

I have tested calling a few API endpoints directly from the page and it works as expected - this does make it much easier to have both the specification under version control and to serve it with the Swagger-UI, without having to set up a server or a service to serve the Swagger-UI, like: [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express) - which is a fine piece of software, but it is not necessary, as just demonstrated.

## Extras

Finally I have added a GitHub Action to validate the Swagger definition file using the `swagger-validator` action.:

```yaml
on: push
name: Validate API swagger definition file
jobs:
  validate:

    runs-on: ubuntu-latest

    steps:
    - name: Get OpenAPI/Swagger definition file
      uses: actions/checkout@v4
    - name: Validate OpenAPI/Swagger definition file
      uses: mbowman100/swagger-validator-action@master
      with:
        files: swagger.json
```

REF: `.github/workflows/swagger-validator.yml`

Do note that the action is based on [swagger-cli][SWAGGERCLI] which is deprecated, so I am looking for an alternative.

Finally I need to work out the process of updating the contents of the `api-docs/` directory in the repository from the Swagger-UI `dist/` directory, so I can keep the Swagger-UI up-to-date.

I have signed up for notifications on releases and security announcements and I have created this little Perl script to compare:

- `api-docs/` directory
- `dist/` directory

```perl
#!/usr/bin/env perl

use warnings;
use strict;
use Data::Dumper;
use File::Find;
use Crypt::Digest::SHA256 qw(sha256_file_hex);

my $baseline_directory = $ARGV[0];
my $new_directory = $ARGV[1];

if (scalar(@ARGV) != 2) {
    print "Usage: $0 <new_directory> <baseline_directory>\n";
    exit 1;
}

if (! -d $new_directory) {
    print "New directory does not exist\n";
    exit 1;
}

if (! -d $baseline_directory) {
    print "Baseline directory does not exist\n";
    exit 1;
}

my %baseline_files;

my @updated_files;
my @new_files;
my @unchanged_files;

find(\&handle_baseline, $baseline_directory);

find(\&handle_new, $new_directory);

my @deleted_files = keys %baseline_files;

print STDERR 'New files: ', Dumper \@new_files;
print STDERR 'Updated files: ', Dumper \@updated_files;
print STDERR 'Deleted files: ', Dumper \@deleted_files;
print STDERR 'Unchanged files: ', Dumper \@unchanged_files;

exit 0;

sub handle_baseline {
    -f $_ && -r $_ or return;
    
    my $baseline_file = $File::Find::name;

    $baseline_files{$_} = sha256_file_hex($_);
        
}

sub handle_new {
    -f $_ && -r $_ or return;

    my $new_file = $_;

    if (grep { $_ eq $new_file } keys %baseline_files) {

        if (sha256_file_hex($new_file) eq $baseline_files{$new_file}) {
            push @unchanged_files, $new_file;
        } else {
            push @updated_files, $new_file;
        }
        delete $baseline_files{$new_file};
    } else {
        push @new_files, $new_file;
    }
}
```

Do note the scipt relies on the `Crypt::Digest::SHA256` module, which can be installed using `cpan`:

```bash
cpanm Crypt::Digest::SHA256
```

And does currently not handle subdirectories, it could be changed to do so, but I do not believe it is necessary at the moment.

```bash
perl compare_directories.pl dist api-docs
```

With release [5.22.0](https://github.com/swagger-api/swagger-ui/releases/tag/v5.22.0) the `swagger-ui` the output would look as follows, running it in the root of the repository:

```bash
compare_directories.pl ~/Downloads/swagger-ui-5.22.0/dist api-docs
New files: $VAR1 = [];
Updated files: $VAR1 = [
          'swagger-ui-es-bundle-core.js.map',
          'swagger-ui.js',
          'swagger-ui-es-bundle-core.js',
          'swagger-ui.css',
          'swagger-ui.js.map',
          'swagger-ui-bundle.js',
          'swagger-ui.css.map',
          'swagger-ui-standalone-preset.js',
          'swagger-initializer.js',
          'swagger-ui-es-bundle.js'
        ];
Deleted files: $VAR1 = [];
Unchanged files: $VAR1 = [
          'favicon-16x16.png',
          'index.html',
          'swagger-ui-standalone-preset.js.map',
          'index.css',
          'swagger-ui-es-bundle.js.map',
          'swagger-ui-bundle.js.map',
          'oauth2-redirect.html',
          'favicon-32x32.png'
        ];
```

Then I should be able to do a `cp` of the files in the `Updated files` list to the `api-docs/` directory.

The interesting part here is detected that it has changed and just copying the lot.

```bash
cp -R ~/Downloads/swagger-ui-5.22.0/dist/ api-docs/
```

Alternativly to downloading the tar-ball you could make a fork and clone it and then copy the files from the `dist/` directory to the `api-docs/` directory.

## Local Testing

To test locally you have to do the following steps.

Do note you need:

- Ruby
- Bundler

---

- Clone the repository
- Navigate to the repository root
- Install Jekyll and the dependencies:

```bash
bundle install
```

- Start a web server, e.g.:

```bash
bundle exec jekyll serve
```

- Open a browser and navigate to the Swagger-UI:

```bash
open http://localhost:4000/gh-pages-swagger-ui-experiment/api-docs/
```

And then you can test the GitHub Pages with Swagger-UI swag locally.

Do note if you have made changes to: `swagger-initializer.js` you need to reapply these changes to the file in the `dist/` directory, since it has possibly been overwritten with the update.

## Caveats

- [GitHub pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages) are public.

## Resources and References

- [SwaggerUI installation][SWAGGERUI]
- [StackOverflow: Swagger UI with Multiple URLs][MULTIPLE]
- [GitHub Marketplace: Validate Swagger and OpenAPI using swagger-cli][VALIDATIONACTION]
- [GitHub: swagger-cli][SWAGGERCLI]
- [GitHub: Test locally with Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll)

[SWAGGERUI]: https://swagger.io/docs/open-source-tools/swagger-ui/usage/installation
[MULTIPLE]: https://stackoverflow.com/questions/44816594/swagger-ui-with-multiple-urls
[VALIDATIONACTION]: https://github.com/marketplace/actions/validate-swagger-and-openapi-using-swagger-cli
[SWAGGERCLI]: https://apitools.dev/swagger-cli/
