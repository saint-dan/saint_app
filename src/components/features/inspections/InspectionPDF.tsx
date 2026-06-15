'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles specifically for the PDF document
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10, color: '#334155' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '2pt solid #2563eb', paddingBottom: 15 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1e3a8a', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748b' },
  logo: { width: 120, height: 40, objectFit: 'contain' }, // Assumes public/logo.png
  
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 20 },
  metaItem: { width: '50%', marginBottom: 8 },
  metaLabel: { fontSize: 8, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  metaValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a' },

  section: { marginTop: 15, marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', backgroundColor: '#e2e8f0', padding: '6 8', marginBottom: 10, color: '#1e293b' },
  
  questionBlock: { marginBottom: 12, paddingBottom: 12, borderBottom: '1pt solid #f1f5f9' },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  questionText: { flex: 1, paddingRight: 15, fontSize: 10, color: '#334155', lineHeight: 1.4 },
  
  badge: { padding: '3 6', borderRadius: 4, fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center', minWidth: 40 },
  badgeYes: { backgroundColor: '#dcfce7', color: '#166534' },
  badgeNo: { backgroundColor: '#fee2e2', color: '#991b1b' },
  badgeNA: { backgroundColor: '#f1f5f9', color: '#475569' },
  
  comments: { marginTop: 4, fontSize: 9, color: '#64748b', fontStyle: 'italic' },
  
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
  photoWrapper: { width: 150, height: 100, border: '1pt solid #e2e8f0', padding: 2, borderRadius: 4 },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },

  signaturesContainer: { marginTop: 30, paddingTop: 20, borderTop: '2pt solid #e2e8f0', flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  signatureBlock: { width: '45%', marginBottom: 15 },
  signatureImageWrapper: { width: '100%', height: 60, borderBottom: '1pt solid #cbd5e1', marginBottom: 6, paddingBottom: 2 },
  signatureImage: { width: '100%', height: '100%', objectFit: 'contain' },
  signatureName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  signaturePosition: { fontSize: 8, color: '#64748b', marginTop: 2 },
});

export interface InspectionPDFProps {
  date: string;
  inspectorName: string;
  builderName: string;
  siteName: string;
  operatives: number | string;
  supervisor: string;
  sections: any[];
  questions: any[];
  responses: Record<string, any>;
  signatures: any[];
}

export default function InspectionPDF({
  date,
  inspectorName,
  builderName,
  siteName,
  operatives,
  supervisor,
  sections,
  questions,
  responses,
  signatures
}: InspectionPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header Area */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Saint Inspection Report</Text>
            <Text style={styles.subtitle}>Health, Safety & Quality Checklist</Text>
          </View>
          {/* Uses standard absolute path for the public folder logo */}
          <Image src="/logo.png" style={styles.logo} />
        </View>

        {/* Meta Information */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>Date</Text><Text style={styles.metaValue}>{date}</Text></View>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>Inspector</Text><Text style={styles.metaValue}>{inspectorName}</Text></View>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>Builder</Text><Text style={styles.metaValue}>{builderName || 'N/A'}</Text></View>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>Site</Text><Text style={styles.metaValue}>{siteName || 'N/A'}</Text></View>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>Operatives on Site</Text><Text style={styles.metaValue}>{operatives || '0'}</Text></View>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>Supervisor Qualification</Text><Text style={styles.metaValue}>{supervisor || 'N/A'}</Text></View>
        </View>

        {/* Checklist Content */}
        {sections.map((section) => {
          const sectionQuestions = questions.filter(q => q.section_id === section.id);
          if (sectionQuestions.length === 0) return null;

          return (
            <View key={section.id} style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              
              {sectionQuestions.map(q => {
                const resp = responses[q.id] || {};
                const isCompliant = resp.isCompliant;
                
                let badgeStyle = styles.badgeNA;
                let badgeText = 'N/A';
                if (isCompliant === true) { badgeStyle = styles.badgeYes; badgeText = 'YES'; }
                if (isCompliant === false) { badgeStyle = styles.badgeNo; badgeText = 'NO'; }

                return (
                  <View key={q.id} style={styles.questionBlock} wrap={false}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionText}>{q.question_text}</Text>
                      {(q.response_types?.code === 'YES_NO_NA_COMMENTS' || q.response_types?.code === 'YES_NO_NA') && (
                        <Text style={[styles.badge, badgeStyle]}>{badgeText}</Text>
                      )}
                    </View>
                    
                    {resp.comments ? <Text style={styles.comments}>Comments: {resp.comments}</Text> : null}
                    
                    {/* Photo Evidence Grid */}
                    {resp.photoUrls && resp.photoUrls.length > 0 && (
                      <View style={styles.photoGrid}>
                        {resp.photoUrls.map((url: string, idx: number) => (
                          <View key={idx} style={styles.photoWrapper}>
                            <Image src={url} style={styles.photo} />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Signatures */}
        <View style={styles.signaturesContainer} wrap={false}>
          {signatures.map((sig, idx) => (
            <View key={idx} style={styles.signatureBlock}>
              <View style={styles.signatureImageWrapper}>
                {sig.signatureData ? <Image src={sig.signatureData} style={styles.signatureImage} /> : null}
              </View>
              <Text style={styles.signatureName}>{sig.name}</Text>
              <Text style={styles.signaturePosition}>{sig.positionName || 'Signee'}</Text>
            </View>
          ))}
        </View>

      </Page>
    </Document>
  );
}