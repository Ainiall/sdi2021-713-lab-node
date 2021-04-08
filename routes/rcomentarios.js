module.exports = function (app, swig, gestorBD) {
    app.post('/comentarios/:cancion_id', function (req, res) {
        if (req.session.usuario == null) {
            res.send('Es necesario estar autenticado para poder comentar. Inicie sesión para poder hacerlo.');
        } else {
            let comentario = {
                autor: req.session.usuario,
                texto: req.body.texto,
                cancion_id: gestorBD.mongo.ObjectID(req.params.cancion_id)
            }

            // Conectarse
            gestorBD.insertarComentario(comentario, function (id) {
                if (id == null) {
                    res.send('Error al insertar comentario');
                } else {
                    res.redirect('/cancion/'+gestorBD.mongo.ObjectID(req.params.cancion_id));
                }
            });
        }
    });

    app.get('/comentario/borrar/:id', function (req, res) {
        let criterio = {'_id': gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerComentarios(criterio, function (comentarios) {
            if (comentarios == null || comentarios[0].autor !== req.session.usuario) {
                res.send('Solo se pueden eliminar comentarios propios');
            } else {
                let comentario = comentarios[0];
                gestorBD.eliminarComentario(comentario, function (result) {
                    if (comentarios == null) {
                        res.send('No se puede eliminar un comentario inexistente');
                    } else {
                        res.redirect('/cancion/'+ comentario.cancion_id);
                    }
                });
            }
        });


    });
}
;
