export const awsConfig = {
  userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID!,
  clientId: process.env.REACT_APP_COGNITO_CLIENT_ID!,
  region: process.env.REACT_APP_COGNITO_REGION!,
  gatewayUrl: process.env.REACT_APP_GATEWAY_URL!,
};

export default awsConfig;
