# SageGreen Cognito Setup Instructions

Your AWS user lacks permissions to create Cognito resources. Here's how to set up Cognito manually:

## 1. Create User Pool (AWS Console)

1. Go to AWS Cognito Console
2. Click "Create user pool"
3. Configure:
   - **Pool name**: `SageGreen-UserPool`
   - **Sign-in options**: Email
   - **Password policy**: Minimum 8 characters, require uppercase, lowercase, numbers
   - **MFA**: Optional
   - **User account recovery**: Email only
   - **Self-registration**: Enabled
   - **Email verification**: Required

## 2. Create App Client

1. In your User Pool, go to "App integration"
2. Click "Create app client"
3. Configure:
   - **App client name**: `SageGreen-WebClient`
   - **Authentication flows**: 
     - ✅ ALLOW_USER_PASSWORD_AUTH
     - ✅ ALLOW_REFRESH_TOKEN_AUTH
   - **Callback URLs**: 
     - `https://sagegreen.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
   - **Sign out URLs**:
     - `https://sagegreen.vercel.app`
     - `http://localhost:3000`
   - **Return URL** (optional):
     - `https://sagegreen.vercel.app`

## 3. Create Domain

1. In "App integration" tab
2. Click "Create Cognito domain"
3. Enter domain prefix: `sagegreen-auth`

## 4. Update Environment Variables

After creating resources, update `.env.local`:

```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_COGNITO_DOMAIN=https://sagegreen-auth.auth.us-east-1.amazoncognito.com
```

## 5. Create Test User

In Cognito Console:
1. Go to "Users" tab
2. Click "Create user"
3. Set:
   - **Username**: `testuser@sagegreen.com`
   - **Email**: `testuser@sagegreen.com`
   - **Temporary password**: `TempPass123!`
   - **Send invitation**: No

## 6. Test Authentication

1. Deploy frontend with updated env vars
2. Try logging in with test user
3. User will be prompted to change password on first login

## Alternative: Use Existing Cognito Pool

If you have an existing Cognito User Pool, just update the environment variables with your existing pool details.