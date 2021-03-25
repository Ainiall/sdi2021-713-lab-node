module.exports = function (app, swig) {
    let autores = [{
        'nombre': 'Deryck Whibley',
        'grupo': 'Sum41',
        'rol' : 'Cantante'
    }, {
        'nombre': 'Dave Baksh',
        'grupo': 'Sum41',
        'rol' : 'Cantante'
    }, {
        'nombre': 'Jason McCaslin',
        'grupo': 'Sum41',
        'rol' : 'Bajista'
    }];

    app.get('/autores', function (req, res) {
        let respuesta = swig.renderFile('views/autores.html', {
            vendedor: 'Lista de autores',
            autores: autores
        });

        res.send(respuesta);
    });
    //debe ir antes de :id
    app.get('/autores/agregar', function (req, res) {
        let array= ['Cantante','Batería','Guitarrista','Bajista','Teclista']
        let respuesta = swig.renderFile('views/autores-agregar.html', {roles: array});
        res.send(respuesta);
    })

    app.get('/autor/:id', function (req, res) {
        let respuesta = 'id: ' + req.params.id;
        res.send(respuesta);
    });

    app.post('/autor', function (req, res) {
        let msg='';
        if(typeof(req.body.nombre) === undefined || req.body.nombre.trim().length===0){
            msg+='\n---Nombre no enviado en la petición.'
        }
        if(typeof(req.body.grupo) === undefined || req.body.grupo.trim().length===0){
            msg+='\n---Grupo no enviado en la petición.'
        }
        if(typeof(req.body.rol) === undefined || req.body.rol.trim().length===0){
            msg+='\n---Rol no enviado en la petición.'
        }
        res.send('Autor agregado:' + req.body.nombre + '<br>'
            + ' grupo: ' + req.body.grupo + '<br>'
            + ' rol: ' + req.body.rol + '<br>'
            + msg);

    });

    app.get('/autores/filtrar/:rol', function (req, res) {
        let filtered= autores.filter(x=> x.rol===req.params.rol);
        let msg='';
        filtered.forEach(x=>msg+=x.nombre+" ")
        let respuesta = 'Rol: ' + req.params.rol + '<br>'
            + 'Autores: ' + msg;
        res.send(respuesta);
    })

    app.get('/autores*', function (req, res) {
        res.redirect('/autores');
    })

};
