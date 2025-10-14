// Configuration constants
export const CONFIG = {
  AWS: {
    REGION: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  },
  BEDROCK: {
    AGENT_ID: 'XMJHPK00RO',
    AGENT_ALIAS_ID: 'PDGGKSDLVP',
  },
  COGNITO: {
    USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-1_bdqsU9GjR',
    CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '3d51afuu9se41jk2gvmfr040dv',
    DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || 'https://us-east-1bdqsu9gjr.auth.us-east-1.amazoncognito.com',
  }
};