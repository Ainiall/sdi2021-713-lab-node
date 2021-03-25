module.exports = function (app, swig) {
    app.get('/autores', function (req, res) {
        let autores = [{
            'nombre': 'Deryck Whibley',
            'grupo': 'Sum41',
            'rol' : 'cantante'
        }, {
            'nombre': 'Dave Baksh',
            'grupo': 'Sum41',
            'rol' : 'guitarrista'
        }, {
            'nombre': 'Jason McCaslin',
            'grupo': 'Sum41',
            'rol' : 'bajista'
        }];

        let respuesta = swig.renderFile('views/autores.html', {
            vendedor: 'Lista de autores',
            autores: autores
        });

        res.send(respuesta);
    });
    //debe ir antes de :id
    app.get('/autores/agregar', function (req, res) {
        let respuesta = swig.renderFile('views/autores-agregar.html', {});
        res.send(respuesta);
    })

    app.get('/autor/:id', function (req, res) {
        let respuesta = 'id: ' + req.params.id;
        res.send(respuesta);
    });

    app.post('/autor', function (req, res) {
        let msg="";
        if(typeof(req.body.nombre) === undefined || req.body.nombre.toString().trim().length===0){
            msg+='\n---Nombre no enviado en la petición.'
        }
        if(typeof(req.body.grupo) === undefined || req.body.grupo.toString().trim().length===0){
            msg+='\n---Grupo no enviado en la petición.'
        }
        if(typeof(req.body.rol) === undefined || req.body.rol.toString().trim().length===0){
            msg+='\n---Rol no enviado en la petición.'
        }
        res.send('Autor agregado:' + req.body.nombre + '<br>'
            + ' grupo: ' + req.body.grupo + '<br>'
            + ' rol: ' + req.body.rol + '<br>'
            + msg);

    });

    app.get('/autores*', function (req, res) {
        res.redirect('autores');
    })

};
