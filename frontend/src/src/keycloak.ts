import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: 'http://localhost:8180',
  realm: 'finans-portali',
  clientId: 'finans-portali-frontend',
})

export default keycloak
