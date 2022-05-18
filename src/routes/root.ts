import { FastifyPluginAsync } from "fastify";
import * as through2 from "through2";
import * as pump from "pump";

const cache = new Map<string, any>();

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/*", {}, (request, reply) => {
    console.log(request.url);
    let actualResponse = "";

    if (cache.has(request.url)) {
      reply.send(cache.get(request.url));
    } else {
      reply.from(request.url, {
        onResponse: (request, reply, res) => {
          pump(
            res,
            through2((chunk: any, enc: any, cb: any) => {
              actualResponse += chunk.toString();
              cb(null, chunk);
            }),
            reply.raw,
            function (err) {
              console.log(err);
              cache.set(request.url, JSON.parse(actualResponse));
            }
          );
        },
      });
    }
  });
};

export default root;
