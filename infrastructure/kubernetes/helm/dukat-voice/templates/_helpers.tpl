{{/*
Expand the name of the chart.
*/}}
{{- define "dukat-voice.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}