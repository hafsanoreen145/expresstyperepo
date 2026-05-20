/**
 * Cloudflare Workers Handler
 * Adapter to run Express.js app on Cloudflare Workers
 */

import { createServer } from 'http';
import app from './server';

// Create HTTP server
const server = createServer(app);

// Export default handler for Cloudflare Workers
export default {
  async fetch(request: Request): Promise<Response> {
    return new Promise((resolve) => {
      const handleUpgrade = () => {
        resolve(
          new Response('Upgrade header required', {
            status: 426,
          })
        );
      };

      server.on('upgrade', handleUpgrade);
      server.once('request', (req: any, res: any) => {
        // Handle the request
        res.on('finish', () => {
          server.removeListener('upgrade', handleUpgrade);
        });
      });

      // Create a Node.js request from the Fetch API request
      const method = request.method;
      const url = new URL(request.url);
      const headers: Record<string, string> = {};

      request.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      const req = Object.create(server.createConnection);
      req.method = method;
      req.url = `${url.pathname}${url.search}`;
      req.headers = headers;
      req.socket = {
        destroy: () => {},
        end: () => {},
        write: () => {},
        on: () => {},
        once: () => {},
      };

      let body = '';
      const respond = new Promise<void>((resolveResp) => {
        const chunks: any[] = [];
        const res = Object.create({
          statusCode: 200,
          headers: {},
          write: (chunk: any) => {
            chunks.push(chunk);
          },
          end: (data?: any) => {
            if (data) chunks.push(data);
            body = Buffer.concat(chunks).toString();
            resolveResp();
          },
          setHeader: (key: string, value: string) => {
            res.headers[key.toLowerCase()] = value;
          },
          getHeader: (key: string) => res.headers[key.toLowerCase()],
          removeHeader: (key: string) => {
            delete res.headers[key.toLowerCase()];
          },
          writeHead: (status: number, headers?: Record<string, string>) => {
            res.statusCode = status;
            if (headers) {
              Object.entries(headers).forEach(([k, v]) => {
                res.headers[k.toLowerCase()] = v;
              });
            }
          },
          on: () => {},
        });

        // Forward to Express
        app(req, res);
      });

      respond.then(() => {
        const headers = new Headers();
        Object.entries(req.res?.headers || {}).forEach(([key, value]: any) => {
          if (typeof value === 'string') {
            headers.set(key, value);
          }
        });

        resolve(
          new Response(body, {
            status: req.res?.statusCode || 200,
            headers,
          })
        );
      });
    });
  },
};
