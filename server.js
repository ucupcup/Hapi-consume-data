const Hapi = require('@hapi/hapi');
const got = require('got');

const {
    ORDER_SERVICE_PORT = 4000,
    USER_SERVICE_PORT = 5000,
} = process.env;

const orderService = `http://localhost:${ORDER_SERVICE_PORT}`;
const userService = `http://localhost:${USER_SERVICE_PORT}`;

const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
    });

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);

    server.route([
        {
            method: 'GET',
            path: '/{id}',
            handler: async (req, h) => {
                const { id } = req.params;

                try {
                    const [ order, user ] = await Promise.allSettled([
                        got(`${orderService}/${id}`).json(),
                        got(`${userService}/${id}`).json(),
                    ]);

                    if (order.status === 'rejected' || user.status === 'rejected') {
                        return h.response({ message: 'Data not found or invalid' }).code(404);
                    }                    

                    return {
                        id: order.value.id,
                        menu: order.value.menu,
                        user: user.value.name,
                    };
                } catch (err) {
                    console.log('Error', err.message);
                    if (!err.response) throw err;
                    if (err.response.statusCode === 400) {
                        return h.response({ message: 'Bad Request' }).code(400);
                    }
                    if (err.response.statusCode === 404) {
                        return h.response({ message: 'Not Found' }).code(404);
                    }

                    throw err;
                }
            },
        },
    ]);
};

init();