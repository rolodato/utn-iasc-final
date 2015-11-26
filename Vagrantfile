# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.define "db" do |db|
    db.vm.box = "ubuntu/trusty64"
    db.vm.network "private_network", ip: "192.168.50.10"
    db.vm.network "forwarded_port", guest: 5432, host: 5432
    db.vm.provision "shell", path: "vagrant/provision_db.sh"
  end

  config.vm.define "primary" do |primary|
    primary.vm.box = "ubuntu/trusty64"
    primary.vm.network "private_network", ip: "192.168.50.20"
    primary.vm.network "forwarded_port", guest: 3000, host: 3000
    primary.vm.provision "shell", path: "vagrant/provision_node.sh"
    primary.vm.provision "shell", inline: "killall node; cd /vagrant && node index.js -f > primary.log 2>&1 &", privileged: false, run: "always"
  end

  config.vm.define "secondary" do |secondary|
    secondary.vm.box = "ubuntu/trusty64"
    secondary.vm.network "private_network", ip: "192.168.50.30"
    secondary.vm.network "forwarded_port", guest: 3000, host: 3001
    secondary.vm.provision "shell", path: "vagrant/provision_node.sh"
    secondary.vm.provision "shell", inline: "killall node; cd /vagrant && node secondary.js > secondary.log 2>&1 &", privileged: false, run: "always"
  end
end
