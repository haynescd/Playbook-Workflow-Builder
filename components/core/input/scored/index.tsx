import React from 'react'
import { MetaNode } from '@/spec/metanode'
import { z } from 'zod'
import { Gene, Drug, Primative, Pathway, Phenotype, Tissue, Disease } from '@/components/core/input/primitives'
import { Table, Cell, Column } from '@/app/components/Table'
import { weighted_icon } from '@/icons'
import * as array from '@/utils/array'
import { downloadBlob } from '@/utils/download'

const Scored_T = (T: Primative) => MetaNode.createData(`Scored[${T.name}]`)
  .meta({
    label: `Scored ${T.label}s`,
    description: `ZScores of ${T.label}s`,
    color: T.color,
    icon: [...array.ensureArray(T.icon), weighted_icon],
    tags: {
      Type: {
        [T.label]: 1,
      },
      Cardinality: {
        Scored: 1,
      },
    },
  })
  .codec(z.array(z.object({ term: z.string(), zscore: z.number() })))
  .view(scored => {
    return (
      <Table
        height={500}
        cellRendererDependencies={[scored]}
        numRows={scored.length}
        enableGhostCells
        enableFocusedCell
        downloads={{
          JSON: () => downloadBlob(new Blob([JSON.stringify(scored)], { type: 'application/json;charset=utf-8' }), 'data.json'),
          CSV: () => downloadBlob(new Blob([
            [
              `${T.label},ZScore`,
              ...(scored.map(({ term, zscore }) => [term, zscore].join(',')))
            ].join('\n')
          ], { type: 'text/csv;charset=utf-8' }), 'data.csv'),
        }}
      >
        <Column
          name={T.label}
          cellRenderer={row => <Cell key={row+''}>{scored[row].term}</Cell>}
        />
        <Column
          name="ZScore"
          cellRenderer={row => <Cell key={row+''}>{scored[row].zscore.toPrecision(3)}</Cell>}
        />
      </Table>
    )
  })
  .build()

export const ScoredDiseases = Scored_T(Disease)
export const ScoredDrugs = Scored_T(Drug)
export const ScoredGenes = Scored_T(Gene)
export const ScoredPathways = Scored_T(Pathway)
export const ScoredPhenotypes = Scored_T(Phenotype)
export const ScoredTissues = Scored_T(Tissue)
