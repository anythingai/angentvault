import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';
import { logger } from '../utils/logger';

export class PinataService {
  private jwt: string;
  private gateway: string;

  constructor() {
    this.jwt = config.pinata.jwt || '';
    this.gateway = config.pinata.gateway || 'https://gateway.pinata.cloud';
  }

  async uploadJSON(data: Record<string, any>, fileName = 'data.json'): Promise<{ ipfsHash: string; url: string }> {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataMetadata: { name: fileName },
          pinataContent: data,
        },
        {
          headers: {
            Authorization: `Bearer ${this.jwt}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { IpfsHash } = response.data;
      const url = `${this.gateway}/ipfs/${IpfsHash}`;

      logger.info('Pinned JSON to IPFS', { IpfsHash });
      return { ipfsHash: IpfsHash, url };
    } catch (error) {
      logger.error('Failed to upload JSON to Pinata', error);
      throw new Error('Pinata upload failed');
    }
  }

  async uploadFile(buffer: Buffer, fileName: string): Promise<{ ipfsHash: string; url: string }> {
    try {
      const data = new FormData();
      data.append('file', buffer, { filename: fileName });

      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
        headers: {
          Authorization: `Bearer ${this.jwt}`,
          ...data.getHeaders(),
        },
      });

      const { IpfsHash } = response.data;
      const url = `${this.gateway}/ipfs/${IpfsHash}`;
      logger.info('Pinned file to IPFS', { IpfsHash });
      return { ipfsHash: IpfsHash, url };
    } catch (error) {
      logger.error('Failed to upload file to Pinata', error);
      throw new Error('Pinata upload failed');
    }
  }
} 