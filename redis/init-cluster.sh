#!/bin/bash
redis-cli --cluster create \
  redis-1:6379 \
  redis-2:6380 \
  redis-3:6381 \
  --cluster-replicas 0 \
  --cluster-yes