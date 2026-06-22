import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8081',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'cloud-flight-simulator',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'cloud-flight-simulator-web'
});

export default keycloak;
