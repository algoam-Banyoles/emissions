# AWS Reference

Aquests fitxers inclouen un baseline per desplegar a ECS/Fargate:

- `ecs-task-definition.backend.json`
- `ecs-task-definition.frontend.json`

Infra recomanada:
- RDS PostgreSQL (multi-AZ en produccio)
- ElastiCache Redis
- S3 per fitxers i backups
- CloudWatch Logs i alarms

Variables sensibles via AWS Secrets Manager.
