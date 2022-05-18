import { FastifyPluginAsync } from "fastify";

const cache = new Map<string, any>();

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // admin panel
  fastify.get("/webapp", async (request, reply) => {
    reply.type("text/html");
    return `<!DOCTYPE html>
    <body>
      <h1>Hello World!</h1>
      <a href="/webapp/hello">Hello</a>
    </body>
    </html>
    `;
  });

  fastify.get("/*", {}, (request, reply) => {
    console.log(request.url);
    let actualResponse = "";

    if (cache.has(request.url)) {
      reply.send(cache.get(request.url));
    } else {
      reply.from(request.url, {
        onError(reply, error) {
          reply.send(error.error.message);
        },
        rewriteRequestHeaders(req, headers) {
          console.log(headers.origin);
          headers.origin = "https://fakestoreapi.com";
          return headers;
        },
        onResponse: (request, reply, res) => {
          res.on("data", (chunk) => {
            console.log(chunk.toString());
            actualResponse += chunk.toString();
          });
          res.on("end", () => {
            try {
              cache.set(request.url, JSON.parse(actualResponse));
              reply.send(actualResponse);
            } catch (error: any) {
              reply
                .code(500)
                .send(JSON.stringify({ ok: false, error: error.message }));
            }
          });
        },
      });
    }
  });
};

export default root;
