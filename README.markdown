Instalación
===========

1. Instalar [Vagrant](https://www.vagrantup.com/downloads) y [VirtualBox](https://www.virtualbox.org/wiki/Downloads)
2. `npm install`
3. `vagrant up`
4. Elegir la interfaz de red para hacer bridging

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
