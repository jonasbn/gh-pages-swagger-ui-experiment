window.onload = function() {
  //<editor-fold desc="Changeable Configuration Block">

  // the following lines will be replaced by docker/configurator, when it runs in a docker-container
  window.ui = SwaggerUIBundle({
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
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  });

  //</editor-fold>
};
