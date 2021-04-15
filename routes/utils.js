module.exports = function (app, swig) {
    app.get('/error', function (req, res) {
        // ahora si se va a usar otro tipo
        let respuesta = swig.renderFile('views/error.html', {
            mensaje:req.session.errores.mensaje,
            tipoMensaje: req.session.errores.tipoMensaje || 'alert-danger' //por defecto
            });
        res.send(respuesta);
    });
};