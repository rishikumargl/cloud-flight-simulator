import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'cloud-flight-simulator',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'cloud-flight-simulator-web'
});

export default keycloak;
