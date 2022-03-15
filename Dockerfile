FROM ubuntu:20.04

RUN \
  apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server python3 pip  libmysqlclient-dev && \
  pip install mysql

# Define mountable directories.
VOLUME ["/etc/mysql", "/var/lib/mysql"]

ADD ./data /data

WORKDIR /data

CMD service mysql start && tail -F /var/log/mysql/error.log

# Expose ports.
EXPOSE 3306
