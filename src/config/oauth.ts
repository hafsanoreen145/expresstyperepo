import axios from 'axios';
import { linkedinConfig } from './linkedin';
import { LinkedInTokenResponse, LinkedInProfile, LinkedInUserInfo } from '../types';

export const exchangeCodeForToken = async (code: string): Promise<LinkedInTokenResponse> => {
  try {
    console.log('[OAuth] Starting code-to-token exchange');
    console.log('[OAuth] Code received:', code.substring(0, 20) + '...');
    console.log('[OAuth] Token URL:', linkedinConfig.accessTokenUrl);
    console.log('[OAuth] Client ID:', linkedinConfig.clientId.substring(0, 10) + '...');
    console.log('[OAuth] Redirect URI:', linkedinConfig.redirectUri);
    
    const response = await axios.post(linkedinConfig.accessTokenUrl, {
      grant_type: 'authorization_code',
      code,
      client_id: linkedinConfig.clientId,
      client_secret: linkedinConfig.clientSecret,
      redirect_uri: linkedinConfig.redirectUri,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('[OAuth] Token exchange successful');
    console.log('[OAuth] Access Token:', response.data.access_token?.substring(0, 20) + '...');
    console.log('[OAuth] Token Type:', response.data.token_type);
    console.log('[OAuth] Expires In:', response.data.expires_in);
    
    return response.data;
  } catch (error: any) {
    console.error('[OAuth] Token exchange failed');
    console.error('[OAuth] Error Status:', error.response?.status);
    console.error('[OAuth] Error Data:', error.response?.data);
    console.error('[OAuth] Error Message:', error.message);
    console.error('[OAuth] Full Error:', error);
    throw new Error(`Failed to exchange code for token: ${error.response?.data?.error_description || error.message}`);
  }
};

export const getLinkedInProfile = async (accessToken: string): Promise<LinkedInProfile> => {
  try {
    console.log('[LinkedIn Profile] Starting profile fetch');
    console.log('[LinkedIn Profile] Access Token:', accessToken.substring(0, 20) + '...');
    console.log('[LinkedIn Profile] Profile URL:', linkedinConfig.profileUrl);
    console.log('[LinkedIn Profile] Request Headers:', {
      Authorization: `Bearer ${accessToken.substring(0, 20)}...`,
    });

    const response = await axios.get(linkedinConfig.profileUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('[LinkedIn Profile] Profile fetch successful');
    console.log('[LinkedIn Profile] Response Status:', response.status);
    console.log('[LinkedIn Profile] Profile Data:', response.data);
    
    // Handle OpenID Connect userinfo format
    const userInfo: LinkedInUserInfo = response.data;
    
    // Map OpenID Connect response to expected LinkedInProfile format
    const profile: LinkedInProfile = {
      id: userInfo.sub,
      localizedFirstName: userInfo.given_name,
      localizedLastName: userInfo.family_name,
      email: userInfo.email,
      profilePicture: {
        displayImage: userInfo.picture,
      },
    };
    
    console.log('[LinkedIn Profile] Mapped profile:', profile);
    return profile;
  } catch (error: any) {
    console.error('[LinkedIn Profile] Profile fetch failed');
    console.error('[LinkedIn Profile] Error Status:', error.response?.status);
    console.error('[LinkedIn Profile] Error Status Text:', error.response?.statusText);
    console.error('[LinkedIn Profile] Error Headers:', error.response?.headers);
    console.error('[LinkedIn Profile] Error Data:', error.response?.data);
    console.error('[LinkedIn Profile] Error Message:', error.message);
    console.error('[LinkedIn Profile] Full Error:', error);
    throw new Error(`Failed to fetch LinkedIn profile: ${error.message}`);
  }
};

export const getLinkedInEmail = async (accessToken: string, userInfo?: LinkedInUserInfo): Promise<string> => {
  try {
    // Email is already included in userinfo from OpenID Connect
    if (userInfo?.email) {
      console.log('[LinkedIn Email] Email already available from userinfo:', userInfo.email);
      return userInfo.email;
    }

    console.log('[LinkedIn Email] Starting email fetch from separate endpoint');
    console.log('[LinkedIn Email] Email URL:', linkedinConfig.emailUrl);
    
    const response = await axios.get(linkedinConfig.emailUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('[LinkedIn Email] Email fetch successful');
    console.log('[LinkedIn Email] Response Status:', response.status);
    console.log('[LinkedIn Email] Email Response:', response.data);

    const email = response.data.elements?.[0]?.['handle~']?.emailAddress;
    console.log('[LinkedIn Email] Extracted email:', email);
    
    return email || '';
  } catch (error: any) {
    console.error('[LinkedIn Email] Email fetch failed');
    console.error('[LinkedIn Email] Error Status:', error.response?.status);
    console.error('[LinkedIn Email] Error Data:', error.response?.data);
    console.error('[LinkedIn Email] Error Message:', error.message);
    throw new Error(`Failed to fetch LinkedIn email: ${error.message}`);
  }
};
