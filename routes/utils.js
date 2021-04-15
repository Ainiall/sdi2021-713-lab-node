module.exports = function (app, swig) {
    app.get('/errors', function (req, res) {
        let respuesta = swig.renderFile('views/error.html',
            {
                mensaje: req.session.errores.mensaje,
                tipoMensaje: req.session.errores.tipoMensaje
            });
        res.send(respuesta);
    });
}