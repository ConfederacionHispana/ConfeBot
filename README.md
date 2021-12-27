## ConfeBot ~~(nombre provisorio)~~
[![Actions Status](https://github.com/TheNozomi/ConfeBot/workflows/CI/badge.svg)](https://github.com/TheNozomi/ConfeBot/actions)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=TheNozomi_ConfeBot&metric=alert_status)](https://sonarcloud.io/dashboard?id=TheNozomi_ConfeBot)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=TheNozomi_ConfeBot&metric=bugs)](https://sonarcloud.io/dashboard?id=TheNozomi_ConfeBot)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=TheNozomi_ConfeBot&metric=code_smells)](https://sonarcloud.io/dashboard?id=TheNozomi_ConfeBot)
![License](https://img.shields.io/github/license/TheNozomi/ConfeBot)

Bot para el servidor de Discord de la [Confederación de Fandom Hispano](https://confederacion-hispana.fandom.com/es/). Se encarga de autenticar usuarios utilizando sus cuentas de Fandom, y añadir roles en base a las wikis a las que pertenezcan.

El código se encuentra publicado por razones de transparencia, y no tiene la intención de ser particularmente "portable". Sin embargo, no requiere mucho esfuerzo configurarlo para su uso en otro servidor.

### Configuración para desarrollo
Se requiere `node >= 14` y `npm >= 7`. De ser posible, utilizar Node 16, para mayor similaridad con el ambiente de producción.

No se requieren pasos especiales para la configuración, simplemente clonar el repositorio y ejecutar `npm install`.

En el archivo `.env.example` se encuentra la lista de las variables de entorno necesarias para su funcionamiento, junto con su descripción.

Por conveniencia, el `package.json` incluye el script `dev`, que inicia el bot en modo development, reiniciándose al detectar cambios.

#### Entorno de desarrollo con Docker
Al utilizar Docker, puede ejecutarse simplemente con `docker compose up`, que iniciará el bot y los servicios de los que depende en contenedores.
