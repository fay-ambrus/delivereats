#!/bin/bash

kubectl exec -it deployment/postgres -- psql -U postgres -d users -c "TRUNCATE TABLE user_events CASCADE;"
kubectl exec -it deployment/postgres -- psql -U postgres -d menu -c "TRUNCATE TABLE menu_item_events CASCADE;"
kubectl exec -it deployment/mongodb -- mongo orders --eval "db.order_events.deleteMany({})"
kubectl exec -it deployment/mongodb -- mongo couriers --eval "db.courier_events.deleteMany({})"
kubectl exec -it deployment/mongodb -- mongo restaurants --eval "db.restaurant_events.deleteMany({})"
