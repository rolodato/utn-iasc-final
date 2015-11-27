Instalación
===========

1. Instalar [Vagrant](https://www.vagrantup.com/downloads) y [VirtualBox](https://www.virtualbox.org/wiki/Downloads)
2. Se necesita `pg_config` en el `PATH`:
  * Ubuntu/Debian: `sudo apt-get install libpq-dev`
  * OS X: `brew install postgres`
  * Windows: [Bajar PostgreSQL](http://www.postgresql.org/download/windows/) y agregar `bin` dentro del directorio de instalación al `PATH`
3. Editar `.env`, agregar IP local en la variable `LOCAL_IP` (ej. `LOCAL_IP=192.168.1.102`)
4. `npm install`
5. `vagrant up`

Si todo levantó correctamente, el primario empieza a enviar heartbeats al secundario.

Se pueden ver los logs en los archivos `primary.log` y `secondary.log` (ej. `tail -f secondary.log`)

Uso
===

Levantar el servidor de aplicación:

```sh
node index.js
```

Levantar de cero, borrando la base de datos:

```sh
node index.js -f
```

Levantar el servidor secundario (escucha heartbeats del primario):

```sh
node secondary.js
```
