module.exports = function (app, swig, gestorBD, next) {
    app.get('/favoritos/add/:cancion_id', function (req, res) {
        let criterio = {'_id': gestorBD.mongo.ObjectID(req.params.cancion_id)};
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                next(new Error('Error al marcar la canción como favorita.'));
            } else {
                req.session.favoritos.push(canciones[0]);
                res.redirect('/favoritos')
            }
        });

    });

    app.get('/favoritos', function (req, res) {
        let price = 0;
        if (req.session.favoritos) {
            req.session.favoritos.forEach(function (fav) {
                price += parseFloat(fav.precio);
            });
        }
        let respuesta = swig.renderFile('views/favoritos.html',
            {
                favoritos: req.session.favoritos,
                total: price
            });
        res.send(respuesta);
    });

    app.get('/favoritos/eliminar/:cancion_id', function (req, res, next) {
        let criterio = {'_id': gestorBD.mongo.ObjectID(req.params.cancion_id)};
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                next(new Error('Error al obtener la canción.'));
            } else {
                req.session.favoritos.splice(req.session.favoritos.indexOf(canciones));
                res.redirect('/favoritos');
            }
        });
    });
};
