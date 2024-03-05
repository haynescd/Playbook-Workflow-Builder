import React from "react";
import { MetaNode } from '@/spec/metanode'
import { z } from 'zod'
import { glygen_icon } from '@/icons'
import { GlycanTerm } from '@/components/core/input/term'
import { GlycanSet } from '@/components/core/input/set'
import { GlycanResponse, GlyGenGlycanSetResponse } from "./data_models";
import { GlycanClassification, GlycanCrossRef } from "./sup_components";

// --- Data Metanodes --- //

export const GlycanViewResponseNode = MetaNode('GlycanViewResponse')
  .meta({
    label: 'Glycan information',
    description: 'Glycan information from GlyGen'
  })
  .codec(GlycanResponse)
  .view(data => {
    const glyGenLink = `http://www.glygen.org/glycan/${data.glytoucan.glytoucan_ac}`;

    return (
      <div className="prose">
        <div>GlyTouCan Accession: 
          <b>
            <a href={glyGenLink} target='_blank' rel='noopener nonreferrer' style={{color: 'blue'}}> <u style={{color: 'blue'}}>{data.glytoucan.glytoucan_ac}</u></a>
          </b>
        </div>
        <div>Monoisotopic Mass: <b>{data.mass} Da</b></div>
        <div>Monoisotopic Mass-pMe (Da): <b>{data.mass_pme} Da</b></div>
        <div>
          Glycan Type / Glycan Subtype: <b><GlycanClassification classification={data.classification}/></b>
        </div>
        <div>
          <GlycanCrossRef crossref={data.crossref}/>
        </div>
        <div>
          Glycan Image: 
          <img src={`https://api.glygen.org/glycan/image/${data.glytoucan.glytoucan_ac}/`} alt='Glycan Image'/>
        </div>
      </div>
    )
  })
  .build()

// --- Process Metanodes --- //

export const GlycanInformation = MetaNode('GlycanInformation')
  .meta({
    label: 'Search GlyGen by GlyTouCan Accession',
    description: 'Search for Glycan information',
    // icon: []
    pagerank: 2
  })
  .inputs({ glycan: GlycanTerm })
  .output(GlycanViewResponseNode)
  .resolve(async (props) => {
    // get glycan data 
    const detail_response = await fetch(`https://api.glygen.org/glycan/detail/${props.inputs.glycan}`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ glytoucan_ac: props.inputs.glycan })
    })
    const glycan_data = await detail_response.json();
    return glycan_data
  })
  .story(props => 
    `The GlyGen database [\\ref{doi:10.1093/glycob/cwz080}] was searched to identify a information about ${props.inputs ? props.inputs.glycan : 'the glycan'}.`
  )
  .build()

