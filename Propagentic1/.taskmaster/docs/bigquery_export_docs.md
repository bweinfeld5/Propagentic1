# BigQuery Export for Firestore Audit Logs

## Overview

This document describes the implementation of Task #14: "Set up BigQuery export for Firestore audit logs". The solution enables exporting Firestore security rule evaluations and other audit logs to BigQuery for analysis, compliance monitoring, and security investigations.

## Architecture

The implementation uses the following components:

1. **Log Sink**: A Cloud Logging sink that captures Firestore audit logs based on a filter
2. **Pub/Sub**: A topic and subscription to stream the logs in real-time
3. **BigQuery**: A dataset and table to store and analyze the logs
4. **Dataflow**: A streaming job to process logs from Pub/Sub and load them into BigQuery

This architecture provides real-time streaming of audit logs with minimal latency and allows for complex analytics.

## Setup

The setup is automated through the `scripts/setup-bigquery-export.sh` script. To run it:

```bash
chmod +x scripts/setup-bigquery-export.sh
./scripts/setup-bigquery-export.sh
```

The script will:

1. Create a BigQuery dataset to store the audit logs
2. Create a Pub/Sub topic for streaming the logs
3. Set up a log sink to export Firestore audit logs to Pub/Sub
4. Create a Pub/Sub subscription
5. Create a BigQuery table with the appropriate schema
6. Set up a Dataflow job to stream logs from Pub/Sub to BigQuery

## Log Data Schema

The BigQuery table schema includes fields for analyzing security rule evaluations:

- `timestamp`: When the operation occurred
- `method_name`: The Firestore API method that was called
- `resource_name`: Document path or collection being accessed
- `user_id` and `email`: Identity of the requester
- `processing_duration`: Time taken to process the request
- `status_code` and `status_message`: Operation result
- `denied_reason`: If a security rule denied the request
- Other metadata fields

## Sample Queries

Sample BigQuery SQL queries are provided in `scripts/firestore_audit_log_queries.sql` for:

1. Identifying the most frequently called methods
2. Finding the slowest operations
3. Tracking data access by user
4. Monitoring failed operations
5. Analyzing access patterns by time of day
6. Tracking data modifications by collection
7. Investigating security rule denials
8. Calculating average processing time by method
9. Monitoring access by client IP address
10. Tracking daily activity trends

## Dashboard Setup

A basic dashboard for analyzing rule denials can be created using Looker Studio:

1. Go to [Looker Studio](https://lookerstudio.google.com/)
2. Create a new report
3. Add your BigQuery table as a data source
4. Create visualizations for:
   - Rule denials over time
   - Most common denied operations
   - Denied operations by user
   - Geographical distribution of denied requests

## Compliance Evidence

The exported logs can serve as evidence for compliance requirements:

1. **Audit Trail**: Complete record of all data access and modifications
2. **Access Control Verification**: Evidence that security rules are working
3. **Incident Response**: Historical data for investigating security incidents
4. **Compliance Reporting**: Generate reports for SOC2, HIPAA, or other compliance frameworks

## Maintenance

Periodic maintenance tasks:

1. **Review Costs**: Monitor BigQuery storage and query costs
2. **Optimize Queries**: Review and optimize frequent queries
3. **Partition Management**: Consider implementing table partitioning for long-term log storage
4. **Access Control**: Review and update access to the BigQuery dataset

## Troubleshooting

Common issues and solutions:

1. **Missing Logs**: Ensure that the log sink filter is correct and that audit logging is enabled
2. **Dataflow Job Errors**: Check the Dataflow job logs for processing errors
3. **BigQuery Quota Issues**: Monitor BigQuery quotas and increase them if necessary
4. **Permission Errors**: Ensure service accounts have appropriate permissions

## Security Considerations

1. **Access Control**: Restrict access to the BigQuery dataset as it contains sensitive audit information
2. **Data Retention**: Configure appropriate retention policies based on compliance requirements
3. **Service Account Management**: Regularly review service account permissions
4. **Query Monitoring**: Monitor who is querying the audit logs and for what purpose 