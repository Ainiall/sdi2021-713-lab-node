module.exports = function (app, gestorBD) {
    app.get('/api/cancion', function (req, res) {
        gestorBD.obtenerCanciones({}, function (canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({error: 'Se ha producido un error'})
            } else {
                res.status(200);
                res.send(JSON.stringify(canciones));
            }
        });
    });

    app.get('/api/cancion/:id', function (req, res) {
        let criterio = {'_id': gestorBD.mongo.ObjectID(req.params.id)}

        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({error: 'Se ha producido un error'})
            } else {
                res.status(200);
                res.send(JSON.stringify(canciones[0]));
                // res.send(canciones[0]) <-- mongoDB lo hace automaticamente
            }
        });
    });

    app.delete('/api/cancion/:id', function (req, res) {
        let criterio = {'_id': gestorBD.mongo.ObjectID(req.params.id)}
        let cancion_id = gestorBD.mongo.ObjectID(req.params.id);
        let usuario = res.usuario;

        let errors = new Array();
        esAutor(usuario, cancion_id, function (isAutor) {
            if (isAutor) {
                gestorBD.eliminarCancion(criterio, function (canciones) {
                    if (canciones == null) {
                        res.status(500);
                        errors.push('Se ha producido un error al eliminar la canción');
                        res.json({errores: errors})
                    } else {
                        res.status(200);
                        res.send(JSON.stringify(canciones));
                    }
                });
            } else {
                res.status(403);
                errors.push('El usuario no es el autor de la canción que intenta eliminar')
                res.json({errores: errors})
            }
        })
    });

    app.post('/api/cancion', function (req, res) {
        let cancion = {nombre: req.body.nombre, genero: req.body.genero, precio: req.body.precio, autor: res.usuario}
        // ¿Validar nombre, genero, precio?
        validar(cancion, function (errors) {
            if (errors !== null && errors.length > 0) {
                res.status(403);
                res.json({errores: errors})
            } else {
                gestorBD.insertarCancion(cancion, function (id) {
                    if (id == null) {
                        errors.push('Se ha producido un error');
                        res.status(500);
                        res.json({errores: errors})
                    } else {
                        res.status(201);
                        res.json({mensaje: 'Canción insertada', _id: id})
                    }
                });
            }
        });
    });

    app.put('/api/cancion/:id', function (req, res) {
        let criterio = {'_id': gestorBD.mongo.ObjectID(req.params.id)};
        let cancion = {}; // Solo los atributos a modificar

        let cancion_id = gestorBD.mongo.ObjectID(req.params.id);
        let usuario = res.usuario;
        // validacion campos actuales
        if (req.body.nombre != null) cancion.nombre = req.body.nombre;
        if (req.body.genero != null) cancion.genero = req.body.genero;
        if (req.body.precio != null) cancion.precio = req.body.precio;
        //validacion para actualizar
        let errors = new Array();
        esAutor(usuario, cancion_id, function (isAutor) {
            if (isAutor) {
                validar(cancion, function (errors) {
                    if (errors !== null && errors.length > 0) {
                        res.status(403);
                        res.json({errores: errors})
                    } else {
                        gestorBD.modificarCancion(criterio, cancion, function (result) {
                            if (result == null) {
                                res.status(500);
                                errors.push('Se ha producido un error al modificar la canción');
                                res.json({errores: errors});
                            } else {
                                res.status(200);
                                res.json({mensaje: 'Canción modificada', _id: req.params.id})
                            }
                        });
                    }
                })
            } else {
                res.status(500);
                errors.push('El usuario no es el autor de la canción que intenta modificar');
                res.json({errores: errors});
            }
        })

    });

    app.post('/api/autenticar', function (req, res) {
        let seguro = app.get('crypto').createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');

        let criterio = {
            email: req.body.email,
            password: seguro
        }

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.status(401); // Unauthorized
                res.json({
                    autenticado: false
                })
            } else {
                let token = app.get('jwt').sign(
                    {usuario: criterio.email, tiempo: Date.now() / 1000}, 'secreto');
                res.status(200);
                res.json({
                    autenticado: true,
                    token: token
                })
            }
        });
    });

    // AUXILIAR
    function esAutor(usuario, cancionId, funcionCallback) {
        let criterio = {$and: [{'_id': cancionId}, {'autor': usuario}]};

        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null || canciones.length <= 0) {
                funcionCallback(false);
            } else {
                funcionCallback(true);
            }
        });
    }

    function validar(cancion, funcionCallback) {
        let errors = new Array();
        //precio  positivo
        if (cancion.precio === null || typeof cancion.precio === 'undefined' || cancion.precio < 0 || cancion.precio === '') {
            errors.push('El precio debe ser positivo');
        }
        // título  tenga  una  longitud  mínima o máxima, etcétera
        if (cancion.nombre === null || typeof cancion.nombre === 'undefined' || cancion.nombre === '') {
            errors.push('El nombre no puede  estar vacio');
        }else if (cancion.nombre.length > 50) {
            errors.push('El nombre no puede tener más de 50 caracteres');
        }
        if (cancion.genero === null || typeof cancion.genero === 'undefined' || cancion.genero === '') {
            errors.push('El género no puede  estar vacio');
        }
        if (errors.length > 0) {
            funcionCallback(errors);
        } else {
            funcionCallback(null);
        }

    }
}