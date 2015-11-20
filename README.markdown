Instalación
===========

1. Instalar [Vagrant](https://www.vagrantup.com/downloads) y [VirtualBox](https://www.virtualbox.org/wiki/Downloads)
2. Se necesita `pg_config` en el `PATH`:
  * Ubuntu/Debian: `sudo apt-get install libpq-dev`
  * OS X: `brew install postgres`
  * Windows: [Bajar PostgreSQL](http://www.postgresql.org/download/windows/) y agregar `bin` dentro del directorio de instalación al `PATH`
3. `npm install`
4. `vagrant up`
5. Elegir la interfaz de red para hacer bridging

Uso
===

Para levantar el servidor de aplicación, ejecutar:

```sh
node index.js
```

Para levantar de cero, borrando la base de datos:

```sh
node index.js -f
```
