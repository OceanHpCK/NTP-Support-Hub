// @ts-nocheck
import { httpServerHandler } from 'cloudflare:node';
import http from 'node:http';
import app from './app';
import { setDb } from './db';
import { setEnv } from './env';

const server = http.createServer(app);
const expressHandler = httpServerHandler(server);

export default {
  async fetch(request: Request, env: any, ctx: any) {
    try {
      setEnv(env);
      setDb(env.DB);
      return await expressHandler.fetch(request, env, ctx);
    } catch (error: any) {
      console.error("[Worker Uncaught Exception]:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || String(error),
        stack: error.stack || "Không có stack trace",
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  },
};
