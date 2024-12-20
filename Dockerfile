FROM postgres:14-bullseye
ENV POSTGRES_USER postgres
ENV POSTGRES_DB postgres
ENV POSTGRES_PASSWORD postgres


COPY packages/db/* /docker-entrypoint-initdb.d/
EXPOSE 5432
