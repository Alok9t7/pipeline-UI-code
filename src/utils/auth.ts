import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

import awsConfig from '../awsConfig';

interface LoginError extends Error {
  type?: string;
  cognitoUser?: CognitoUser;
}

export function login(
  username: string,
  password: string,
  newPassword: string | null = null
): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const poolData = {
      UserPoolId: awsConfig.userPoolId,
      ClientId: awsConfig.clientId,
    };

    const userPool = new CognitoUserPool(poolData);
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session: CognitoUserSession) => resolve(session),
      onFailure: (err: Error) => reject(err),
      newPasswordRequired: (userAttributes: { [key: string]: string }) => {
        if (!newPassword) {
          const error: LoginError = new Error('New password required');
          error.type = 'NEW_PASSWORD_REQUIRED';
          error.cognitoUser = cognitoUser;
          return reject(error);
        }

        // ❌ Remove attributes that cannot be re-submitted
        delete userAttributes.email_verified;
        delete userAttributes.email;

        cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
          onSuccess: (session: CognitoUserSession) => resolve(session),
          onFailure: (err: Error) => reject(err),
        });
      },
    });
  });
}
