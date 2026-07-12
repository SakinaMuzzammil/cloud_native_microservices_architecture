#!/bin/bash
# Runs the full benchmark suite comparing the monolithic baseline against
# the microservices architecture (single instance and horizontally scaled).
# All results are written as JSON to benchmarks/results/ for later plotting.
set -e
cd /home/claude/project
mkdir -p benchmarks/results logs

AUTOCANNON="npx --no-install autocannon"
DURATION=5

echo "== killing any stray node processes =="
pkill -f "node services" 2>/dev/null || true
pkill -f "node monolith" 2>/dev/null || true
sleep 1

echo "== starting services =="
nohup env PORT=4001 node services/auth/index.js > logs/auth.log 2>&1 &
nohup env PORT=4002 INSTANCE_ID=product-1 node services/product/index.js > logs/product1.log 2>&1 &
nohup env PORT=4011 INSTANCE_ID=product-2 node services/product/index.js > logs/product2.log 2>&1 &
nohup env PORT=4012 INSTANCE_ID=product-3 node services/product/index.js > logs/product3.log 2>&1 &
nohup env PORT=4013 INSTANCE_ID=product-4 node services/product/index.js > logs/product4.log 2>&1 &
nohup env PORT=4003 PRODUCT_SERVICE_URL=http://localhost:4002 node services/order/index.js > logs/order.log 2>&1 &
nohup env PORT=5000 node monolith/index.js > logs/mono.log 2>&1 &
sleep 2

# Gateway pointing at 1 product instance (baseline microservices config)
nohup env PORT=4000 AUTH_URL=http://localhost:4001 ORDER_URL=http://localhost:4003 PRODUCT_URLS=http://localhost:4002 node services/gateway/index.js > logs/gateway1.log 2>&1 &
sleep 1

echo "== smoke test =="
curl -sf localhost:4000/health && echo " gateway(1) OK"
curl -sf localhost:5000/health && echo " monolith OK"
curl -sf -X POST localhost:4000/api/orders -H 'Content-Type: application/json' -d '{"productId":"p1","qty":1}' && echo " order via gateway OK"
curl -sf -X POST localhost:5000/api/orders -H 'Content-Type: application/json' -d '{"productId":"p1","qty":1}' && echo " order via monolith OK"

echo "== GET /products load test: monolith vs microservices (1 instance), varying concurrency =="
for C in 10 50 100; do
  echo "-- monolith c=$C --"
  $AUTOCANNON -c $C -d $DURATION -j http://localhost:5000/api/products > benchmarks/results/mono_get_c${C}.json
  echo "-- microservices(1 instance) c=$C --"
  $AUTOCANNON -c $C -d $DURATION -j http://localhost:4000/api/products > benchmarks/results/micro1_get_c${C}.json
done

echo "== POST /orders load test (inter-service call overhead): monolith vs microservices, c=50 =="
$AUTOCANNON -c 50 -d $DURATION -j -m POST -H "Content-Type: application/json" -b '{"productId":"p1","qty":1}' http://localhost:5000/api/orders > benchmarks/results/mono_orders_c50.json
$AUTOCANNON -c 50 -d $DURATION -j -m POST -H "Content-Type: application/json" -b '{"productId":"p1","qty":1}' http://localhost:4000/api/orders > benchmarks/results/micro1_orders_c50.json

echo "== scalability test: microservices with 1, 2, 4 product-service instances, fixed c=150 =="
kill %8 2>/dev/null || pkill -f "PORT=4000" 2>/dev/null || true
sleep 1
nohup env PORT=4000 AUTH_URL=http://localhost:4001 ORDER_URL=http://localhost:4003 PRODUCT_URLS=http://localhost:4002 node services/gateway/index.js > logs/gateway_n1.log 2>&1 &
sleep 1
$AUTOCANNON -c 150 -d $DURATION -j http://localhost:4000/api/products > benchmarks/results/scale_n1_c150.json
pkill -f "node services/gateway" 2>/dev/null || true
sleep 1

nohup env PORT=4000 AUTH_URL=http://localhost:4001 ORDER_URL=http://localhost:4003 PRODUCT_URLS=http://localhost:4002,http://localhost:4011 node services/gateway/index.js > logs/gateway_n2.log 2>&1 &
sleep 1
$AUTOCANNON -c 150 -d $DURATION -j http://localhost:4000/api/products > benchmarks/results/scale_n2_c150.json
pkill -f "node services/gateway" 2>/dev/null || true
sleep 1

nohup env PORT=4000 AUTH_URL=http://localhost:4001 ORDER_URL=http://localhost:4003 PRODUCT_URLS=http://localhost:4002,http://localhost:4011,http://localhost:4012,http://localhost:4013 node services/gateway/index.js > logs/gateway_n4.log 2>&1 &
sleep 1
$AUTOCANNON -c 150 -d $DURATION -j http://localhost:4000/api/products > benchmarks/results/scale_n4_c150.json

echo "== done, shutting down =="
pkill -f "node services" 2>/dev/null || true
pkill -f "node monolith" 2>/dev/null || true
sleep 1
echo "BENCHMARKS_COMPLETE"
