import { MetaNode } from '@/spec/metanode'
import { z } from 'zod'
import python from '@/utils/python'
import { GeneTerm } from '@/components/core/term'
import { GeneInfo, GeneInfoFromGeneTerm } from '@/components/service/mygeneinfo'
import { Table, Cell, Column } from '@/app/components/Table'
import { drug_icon } from '@/icons'
import { downloadBlob } from '@/utils/download'
import { ScoredDrugs } from '@/components/core/scored'

export const DrugCytotoxictyChembl = MetaNode(`[DrugCytotoxictyChemblTable]`)
    .meta({
        label: 'Drug Cytotoxicty (CHEMBL)',
        description: `Drug Cytotoxicty CHEMBL`,
        color: '#98D7C2',
        icon: [drug_icon]
    })
    .codec(z.array(z.object({
        //action_type: z.string(),
        activity_comment: z.string().nullable(),
        activity_id: z.number(),
        //activity_properties:z.object(),
        assay_chembl_id: z.string().nullable(),
        assay_description: z.string().nullable(),
        assay_type: z.string(),
        assay_variant_accession: z.string().nullable(),
        assay_variant_mutation: z.string().nullable(),
        bao_endpoint: z.string().nullable(),
        bao_format: z.string().nullable(),
        bao_label: z.string().nullable(),
        canonical_smiles: z.string().nullable(),
        data_validity_comment: z.string().nullable(),
        data_validity_description: z.string().nullable(),
        document_chembl_id: z.string().nullable(),
        document_journal: z.string().nullable(),
        document_year: z.number().nullable(),
        //ligand_efficiency: z.string(),
        molecule_chembl_id: z.string(),
        molecule_pref_name: z.string(),
        parent_molecule_chembl_id: z.string().nullable(),
        pchembl_value: z.number(),
        potential_duplicate: z.number().nullable(),
        qudt_units: z.string().nullable(),
        record_id: z.number().nullable(),
        relation: z.string().nullable(),
        src_id: z.number().nullable(),
        standard_flag: z.number().nullable(),
        standard_relation: z.string().nullable(),
        standard_text_value: z.string().nullable(),
        standard_type: z.string().nullable(),
        standard_units: z.string().nullable(),
        standard_upper_value: z.number().nullable(),
        standard_value: z.number().nullable(),
        target_chembl_id: z.string().nullable(),
        target_organism: z.string().nullable(),
        target_pref_name: z.string().nullable(),
        target_tax_id: z.string().nullable(),
        text_value: z.string().nullable(),
        toid: z.number().nullable(),
        type: z.string().nullable(),
        units: z.string().nullable(),
        uo_units: z.string().nullable(),
        upper_value: z.number().nullable(),
        value: z.number().nullable()
    })))
    .view(drugCytotoxicityTable => {
        return (
            <Table
                height={500}
                cellRendererDependencies={[drugCytotoxicityTable]}
                numRows={drugCytotoxicityTable.length}
                enableGhostCells
                enableFocusedCell
            >
                <Column
                    name="Drug Name"
                    cellRenderer={row => <Cell key={row + ''}>{drugCytotoxicityTable[row].molecule_pref_name}</Cell>}
                />
                <Column
                    name="PCHEMBL Value"
                    cellRenderer={row => <Cell key={row + ''}>{drugCytotoxicityTable[row].pchembl_value}</Cell>}
                />
                <Column
                    name="Molecule CHEMBL ID"
                    cellRenderer={row => <Cell key={row + ''}>{drugCytotoxicityTable[row].molecule_chembl_id}</Cell>}
                />
                <Column
                    name="Parent Molecule CHEMBL ID"
                    cellRenderer={row => <Cell key={row + ''}>{drugCytotoxicityTable[row].parent_molecule_chembl_id}</Cell>}
                />
                <Column
                    name="Activity ID"
                    cellRenderer={row => <Cell key={row + ''}>{drugCytotoxicityTable[row].activity_id}</Cell>}
                />
                <Column
                    name="Assay CHEMBL ID"
                    cellRenderer={row => <Cell key={row + ''}>{drugCytotoxicityTable[row].assay_chembl_id}</Cell>}
                />
                <Column
                    name="Target CHEMBL ID"
                    cellRenderer={row => <Cell key={row + ''}>{drugCytotoxicityTable[row].target_chembl_id}</Cell>}
                />
                <Column
                    name="Standard Units"
                    cellRenderer={row => <Cell key={row + ''}>{drugCytotoxicityTable[row].standard_units}</Cell>}
                />
                <Column
                    name="Standard Value"
                    cellRenderer={row => <Cell key={row + ''}>{drugCytotoxicityTable[row].standard_value}</Cell>}
                />
            </Table>
        )
    }).build()

export const QueryDrugCytotoxocityCHEMBL = MetaNode('QueryDrugCytotoxocityCHEMBL')
    .meta({
        label: 'Query CHEMBL Drug Cytotoxocity',
        description: 'Use CHEMBL API Activity Model to obtain drug cytotoxicity data',
        pagerank: 1,
    })
    .inputs({ ScoredDrugs })
    .output(DrugCytotoxictyChembl)
    .resolve(async (props) => {
        return await python(
            'components.service.drugtoxicity.main',
            { kargs: [props.inputs.ScoredDrugs] },
            message => props.notify({ type: 'info', message }),
        )
    })
    .story(props => ({
        abstract: `Cytotoxicity Results where queried for Drugs`
    }))
    .build()