import React from 'react';
import NavigationPanel from "./template_form/NavigationPanel";
import PageHeader from "./template_form/PageHeader";
import { Container } from "react-bootstrap";

function Transformations(props) {
    return (
        <div className="d-flex h-100 w-100">
            <NavigationPanel/>
            <Container className="page-content w-100 d-flex flex-column">
                <PageHeader name="TRANSFORMATIONS"/>
                
            </Container>
        </div>
    );
}

export default Transformations;