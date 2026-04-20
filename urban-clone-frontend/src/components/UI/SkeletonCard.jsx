import React from "react";
import { Card, Placeholder } from "react-bootstrap";

const SkeletonCard = () => {
  return (
    <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden">
      <div
        style={{ height: "200px", backgroundColor: "#e2e8f0" }}
        className="animate-pulse"
      ></div>
      <Card.Body className="p-4">
        <Placeholder as={Card.Title} animation="glow">
          <Placeholder xs={8} />
        </Placeholder>
        <Placeholder as={Card.Text} animation="glow">
          <Placeholder xs={12} /> <Placeholder xs={10} />
        </Placeholder>
        <div className="d-flex justify-content-between mt-4">
          <Placeholder.Button variant="dark" xs={4} />
          <Placeholder.Button variant="secondary" xs={3} />
        </div>
      </Card.Body>
    </Card>
  );
};

export default SkeletonCard;
