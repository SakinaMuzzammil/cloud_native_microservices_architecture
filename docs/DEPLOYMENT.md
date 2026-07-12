# Cloud deployment guide (AWS)

This guide provisions the reference architecture on Amazon EKS using the
Terraform and Kubernetes manifests included in this repository.

## 1. Prerequisites
- AWS CLI configured with an account that can create VPCs, EKS clusters, and ECR repositories
- Terraform >= 1.5
- kubectl, eksctl
- Docker
- The [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/) add-on (for Ingress -> ALB)

## 2. Provision infrastructure
```bash
cd terraform
terraform init
terraform apply -auto-approve
```
This creates:
- A VPC with public/private subnets across two AZs
- An EKS cluster (`microservices-demo-cluster`) with a managed node group (2-6 t3.medium nodes)
- One ECR repository per microservice (auth-service, product-service, order-service, gateway)

## 3. Point kubectl at the new cluster
```bash
aws eks update-kubeconfig --name microservices-demo-cluster --region us-east-1
```

## 4. Build and push images to ECR
```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1
aws ecr get-login-password --region $REGION | docker login --username AWS \
  --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

for svc in auth-service product-service order-service gateway; do
  name=$(echo $svc | sed 's/-service//')
  docker build -f services/$name/Dockerfile -t $svc:latest . 2>/dev/null || \
  docker build -f $name/Dockerfile -t $svc:latest .
  docker tag $svc:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$svc:latest
  docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$svc:latest
done
```

## 5. Deploy to Kubernetes
Replace `<ECR_REGISTRY>` in `k8s/deployments.yaml` with
`$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com`, then:
```bash
kubectl create secret generic app-secrets \
  --namespace microservices-demo --from-literal=jwt-secret=$(openssl rand -hex 32) \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f k8s/deployments.yaml
kubectl apply -f k8s/ingress.yaml
```

## 6. Verify
```bash
kubectl get pods -n microservices-demo
kubectl get ingress -n microservices-demo
```
The `ADDRESS` column of the Ingress gives the public ALB DNS name. Test with:
```bash
curl http://<alb-dns-name>/api/products
```

## 7. Autoscaling
The `product-service` and `gateway` Deployments each have a
`HorizontalPodAutoscaler` targeting 60% average CPU utilization, scaling
between 2 and 10 (product) / 8 (gateway) pods. This is the mechanism that
gives the architecture the elastic, pay-for-what-you-use scaling property
discussed in the paper -- on the single-core local test-bed used for the
benchmarks in this repository, that hardware-level parallelism is not
available, which is why the local scalability test (Section VI) does not
show throughput improving with pod count; on real multi-node EKS worker
groups it does, because each additional pod can be scheduled onto separate
CPU cores/nodes.

## 8. Teardown
```bash
kubectl delete -f k8s/ingress.yaml -f k8s/deployments.yaml
cd terraform && terraform destroy -auto-approve
```

## Equivalent notes for Azure (AKS) and GCP (GKE)
The same container images and Kubernetes manifests are cloud-agnostic (no
AWS-specific APIs inside the app code). To deploy elsewhere:
- **Azure**: create an AKS cluster (`az aks create`), push images to Azure
  Container Registry (ACR), replace the Ingress annotations with the
  `azure/application-gateway` or NGINX ingress class, and apply the same
  `k8s/deployments.yaml`.
- **GCP**: create a GKE cluster (`gcloud container clusters create`), push
  images to Artifact Registry, use the GKE Ingress class (`kubernetes.io/ingress.class: gce`).
The HorizontalPodAutoscaler, readiness/liveness probes, and service topology
are portable across all three providers since they rely only on the
Kubernetes API, not a provider-specific control plane feature.
