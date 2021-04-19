module.exports = function (app, swig, gestorBD) {
    app.get('/canciones', function (req, res) {
        let canciones = [{
            'nombre': 'Blank space',
            'precio': '1.2'
        }, {
            'nombre': 'See you again',
            'precio': '1.3'
        }, {
            'nombre': 'Uptown Funk',
            'precio': '1.1'
        }];

        let respuesta = swig.renderFile('views/btienda.html', {
            vendedor: 'Tienda de canciones',
            canciones: canciones
        });

        res.send(respuesta);
    });
    //debe ir antes de :id
    app.get('/canciones/agregar', function (req, res) {
        let respuesta = swig.renderFile('views/bagregar.html', {});
        res.send(respuesta);
    });

    app.get('/cancion/modificar/:id', function (req, res, next) {
        let criterio = {'_id': gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                next(new Error('Error al modificar la canción.'));
            } else {
                let respuesta = swig.renderFile('views/bcancionModificar.html', {cancion: canciones[0]});
                res.send(respuesta);
            }
        });
    });

    app.get('/cancion/:id', function (req, res, next) {
        let criterio = {'_id': gestorBD.mongo.ObjectID(req.params.id)};
        let criterioComentario = {'cancion_id': gestorBD.mongo.ObjectID(req.params.id)};
        let usuario = req.session.usuario;
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                next(new Error('Error al recuperar la canción.'));
            } else {
                let cancionId = gestorBD.mongo.ObjectID(req.params.id);
                sePuedeComprar(usuario, cancionId, function (puedeComprar) {
                    gestorBD.obtenerComentarios(criterioComentario, function (comentarios) {
                            if (comentarios == null) {
                                next(new Error('No hay comentarios sobre esta canción.'));
                            } else {
                                let configuracion = {
                                    url: 'https://www.freeforexapi.com/api/live?pairs=EURUSD',
                                    method: 'get',
                                    headers: {'token': 'ejemplo',}
                                }
                                let rest = app.get("rest");
                                rest(configuracion, function (error, response, body) {
                                    console.log('cod: ' + response.statusCode + ' Cuerpo :' + body);
                                    let objetoRespuesta = JSON.parse(body);
                                    let cambioUSD = objetoRespuesta.rates.EURUSD.rate;
                                    // nuevo campo "usd"
                                    canciones[0].usd = cambioUSD * canciones[0].precio;

                                    let respuesta = swig.renderFile('views/bcancion.html',
                                        {
                                            cancion: canciones[0],
                                            comentarios: comentarios,
                                            comprar: puedeComprar
                                        });
                                    res.send(respuesta);
                                })
                            }
                        }
                    );
                });
            }
        });
    });

    app.get('/canciones/:id', function (req, res) {
        let respuesta = 'id: ' + req.params.id;
        res.send(respuesta);
    });
    app.get('/canciones/:genero/:id', function (req, res) {
        let respuesta = 'id: ' + req.params.id + '<br>'
            + 'Género: ' + req.params.genero;
        res.send(respuesta);
    });

    app.get('/suma', function (req, res) {
        let respuesta = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(respuesta));
    });

    app.get('/tienda', function (req, res, next) {
        let criterio = {};
        if (req.query.busqueda != null) {
            criterio = {'nombre': {$regex: '.*' + req.query.busqueda + '.*'}};
        }
        let pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) { // Puede no venir el param
            pg = 1;
        }

        gestorBD.obtenerCancionesPg(criterio, pg, function (canciones, total) {
            if (canciones == null) {
                next(new Error('Error al listar.'));
            } else {
                let ultimaPg = total / 4;
                if (total % 4 > 0) {// Sobran decimales
                    ultimaPg = ultimaPg + 1;
                }
                let paginas = []; // paginas mostrar
                for (let i = pg - 2; i <= pg + 2; i++) {
                    if (i > 0 && i <= ultimaPg) {
                        paginas.push(i);
                    }
                }
                let respuesta = swig.renderFile('views/btienda.html',
                    {canciones: canciones, paginas: paginas, actual: pg});
                res.send(respuesta);
            }
        });
    });

    app.post('/cancion', function (req, res, next) {
        let cancion = {
            nombre: req.body.nombre,
            genero: req.body.genero,
            precio: req.body.precio,
            autor: req.session.usuario
        }

        // Conectarse
        gestorBD.insertarCancion(cancion, function (id) {
            if (id == null) {
                next(new Error('Error al insertar canción.'));
            } else {
                if (req.files.portada != null) {
                    var imagen = req.files.portada;
                    imagen.mv('public/portadas/' + id + '.png', function (err) {
                        if (err) {
                            next(new Error('Error al subir la portada.'));
                        } else {
                            if (req.files.audio != null) {
                                let audio = req.files.audio;
                                audio.mv('public/audios/' + id + '.mp3', function (err) {
                                    if (err) {
                                        next(new Error('Error al subir el audio.'));
                                    } else {
                                        res.redirect('/publicaciones');
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    });

    app.post('/cancion/modificar/:id', function (req, res, next) {
        let id = req.params.id;
        let criterio = {'_id': gestorBD.mongo.ObjectID(id)};
        let cancion = {nombre: req.body.nombre, genero: req.body.genero, precio: req.body.precio}
        gestorBD.modificarCancion(criterio, cancion, function (result) {
            if (result == null || result.autor !== req.session.usuario) {
                next(new Error('Error al modificar.'));
            } else {
                paso1ModificarPortada(req.files, id, function (result) {
                    if (result == null) {
                        next(new Error('Error en la modificación.'));
                    } else {
                        res.redirect('/publicaciones');
                    }
                });
            }
        });
    })

    function paso1ModificarPortada(files, id, callback) {
        if (files && files.portada != null) {
            let imagen = files.portada;
            imagen.mv('public/portadas/' + id + '.png', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    paso2ModificarAudio(files, id, callback); // SIGUIENTE
                }
            });
        } else {
            paso2ModificarAudio(files, id, callback); // SIGUIENTE
        }
    };

    function paso2ModificarAudio(files, id, callback) {
        if (files && files.audio != null) {
            let audio = files.audio;
            audio.mv('public/audios/' + id + '.mp3', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    callback(true); // FIN
                }
            });
        } else {
            callback(true); // FIN
        }
    };

    app.get('/promo*', function (req, res) {
        res.send('Respuesta patrón promo* ');
    });

    app.get('/publicaciones', function (req, res, next) {
        let criterio = {autor: req.session.usuario};
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                next(new Error('Error al listar.'));
            } else {
                let respuesta = swig.renderFile('views/bpublicaciones.html', {canciones: canciones});
                res.send(respuesta);
            }
        });
    });

    app.get('/cancion/eliminar/:id', function (req, res, next) {
        let criterio = {'_id': gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.eliminarCancion(criterio, function (canciones) {
            if (canciones == null || canciones[0].autor !== req.session.usuario) {
                next(new Error('Error al eliminar la canción.'));
            } else {
                // info
                res.redirect('/publicaciones?mensaje=Canción eliminada');
            }
        });
    });

    app.get('/cancion/comprar/:id', function (req, res, next) {
        let cancionId = gestorBD.mongo.ObjectID(req.params.id);
        let usuario = req.session.usuario;
        let compra = {usuario: usuario, cancionId: cancionId}

        sePuedeComprar(usuario, cancionId, function (puedeComprar) {
            if (puedeComprar) {
                gestorBD.insertarCompra(compra, function (idCompra) {
                    if (idCompra == null) {
                        next(new Error('Error al comprar la canción.'));
                    } else {
                        res.redirect('/compras');
                    }
                });
            } else {
                // alert, deberia seguir redirigiendo con mensaje
                res.redirect('/cancion/' + cancionId +
                    '?mensaje=No se puede comprar una canción propia, ni comprar varias veces.' +
                    '&tipoMensaje=alert-danger');
            }
        })
    });

    app.get('/compras', function (req, res, next) {
        let criterio = {'usuario': req.session.usuario};
        gestorBD.obtenerCompras(criterio, function (compras) {
            if (compras == null) {
                next(new Error('Error al listar.'));
            } else {
                let cancionesCompradasIds = [];
                for (i = 0; i < compras.length; i++) {
                    cancionesCompradasIds.push(compras[i].cancionId);
                }
                let criterio = {'_id': {$in: cancionesCompradasIds}}
                gestorBD.obtenerCanciones(criterio, function (canciones) {
                    let respuesta = swig.renderFile('views/bcompras.html',
                        {
                            canciones: canciones
                        });
                    res.send(respuesta);
                });
            }
        });
    });


    // AUXILIAR
    function sePuedeComprar(usuario, cancionId, funcionCallback) {
        let criterio = {$and: [{'_id': cancionId}, {'autor': usuario}]};
        let criterio2 = {$and: [{'cancionId': cancionId}, {'usuario': usuario}]};
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null || canciones.length > 0) {
                funcionCallback(false);
            } else {
                gestorBD.obtenerCompras(criterio2, function (compras) {
                    if (compras == null || compras.length > 0) {
                        funcionCallback(false);
                    } else {
                        funcionCallback(true);
                    }
                });
            }
        });
    }
};
