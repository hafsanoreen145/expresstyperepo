import axios from 'axios';
import { linkedinConfig } from './linkedin';
import { LinkedInTokenResponse, LinkedInProfile } from '../types';

export const exchangeCodeForToken = async (code: string): Promise<LinkedInTokenResponse> => {
  try {
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

    return response.data;
  } catch (error) {
    throw new Error(`Failed to exchange code for token: ${error}`);
  }
};

export const getLinkedInProfile = async (accessToken: string): Promise<LinkedInProfile> => {
  try {
    const response = await axios.get(linkedinConfig.profileUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch LinkedIn profile: ${error}`);
  }
};

export const getLinkedInEmail = async (accessToken: string): Promise<string> => {
  try {
    const response = await axios.get(linkedinConfig.emailUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const email = response.data.elements?.[0]?.['handle~']?.emailAddress;
    return email || '';
  } catch (error) {
    throw new Error(`Failed to fetch LinkedIn email: ${error}`);
  }
};
