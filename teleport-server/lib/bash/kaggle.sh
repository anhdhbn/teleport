wget -q -N teleport.anhdh.tk/bash/setup_ssh.sh -O setup_ssh.sh
chmod u+x setup_ssh.sh
./setup_ssh.sh

wget -q -N teleport.anhdh.tk/download -O teleport
chmod u+x teleport

./teleport -p 22