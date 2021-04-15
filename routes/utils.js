module.exports = function (app, swig) {
    app.get('/error', function (req, res) {
        // mejor no poner tipo mensaje, siempre van a ser errores
        let respuesta = swig.renderFile('views/error.html', {mensaje:req.session.errores.mensaje});
        res.send(respuesta);
    });
};