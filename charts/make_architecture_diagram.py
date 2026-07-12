from graphviz import Digraph

g = Digraph('architecture', format='png')
g.attr(rankdir='TB', splines='ortho', fontname='Helvetica', bgcolor='white', pad='0.3')
g.attr('node', fontname='Helvetica', fontsize='11', shape='box', style='rounded,filled', margin='0.15,0.1')
g.attr('edge', fontname='Helvetica', fontsize='9', color='#555555')

# Client
g.node('client', 'Client\n(Web / Mobile)', fillcolor='#EEEDFE', color='#534AB7')

# Cloud edge
with g.subgraph(name='cluster_edge') as c:
    c.attr(label='Cloud Load Balancer / Ingress (AWS ALB)', style='dashed', color='#888888', fontsize='10')
    c.node('lb', 'Load Balancer', fillcolor='#E6F1FB', color='#185FA5')

# Gateway tier
with g.subgraph(name='cluster_gw') as c:
    c.attr(label='API Gateway tier (Kubernetes Deployment, HPA)', style='dashed', color='#888888', fontsize='10')
    c.node('gw1', 'Gateway pod 1', fillcolor='#E1F5EE', color='#0F6E56')
    c.node('gw2', 'Gateway pod 2', fillcolor='#E1F5EE', color='#0F6E56')

# Microservices tier
with g.subgraph(name='cluster_services') as c:
    c.attr(label='Microservices tier (independently deployable & scalable)', style='dashed', color='#888888', fontsize='10')
    c.node('auth', 'Auth Service\n(JWT issuance)', fillcolor='#FAECE7', color='#993C1D')
    c.node('product', 'Product Service\n(N replicas, HPA)', fillcolor='#FAECE7', color='#993C1D')
    c.node('order', 'Order Service\n(orchestration)', fillcolor='#FAECE7', color='#993C1D')

# Data tier
with g.subgraph(name='cluster_data') as c:
    c.attr(label='Managed data tier', style='dashed', color='#888888', fontsize='10')
    c.node('authdb', 'Auth DB', fillcolor='#F1EFE8', color='#5F5E5A', shape='cylinder')
    c.node('proddb', 'Product DB', fillcolor='#F1EFE8', color='#5F5E5A', shape='cylinder')
    c.node('orderdb', 'Order DB', fillcolor='#F1EFE8', color='#5F5E5A', shape='cylinder')

# Observability
g.node('obs', 'Monitoring & Logging\n(CloudWatch / Prometheus+Grafana)', fillcolor='#FBEAF0', color='#993556', shape='note')

g.edge('client', 'lb')
g.edge('lb', 'gw1')
g.edge('lb', 'gw2')
g.edge('gw1', 'auth')
g.edge('gw1', 'product')
g.edge('gw1', 'order')
g.edge('gw2', 'auth')
g.edge('gw2', 'product')
g.edge('gw2', 'order')
g.edge('order', 'product', label='REST (sync)', style='dashed')
g.edge('auth', 'authdb')
g.edge('product', 'proddb')
g.edge('order', 'orderdb')
g.edge('gw1', 'obs', style='dotted', color='#993556')
g.edge('auth', 'obs', style='dotted', color='#993556')
g.edge('product', 'obs', style='dotted', color='#993556')
g.edge('order', 'obs', style='dotted', color='#993556')

g.render('/home/claude/project/charts/fig0_architecture', cleanup=True)
print("done")
