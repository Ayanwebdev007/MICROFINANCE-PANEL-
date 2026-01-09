import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Col,
    Row,
    Input,
    Label,
    FormGroup,
    Table,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from 'reactstrap';
import { AgGridReact } from 'ag-grid-react';

const ActionButtonRenderer = (props) => {
    const onClick = () => {
        props.onActionClick(props.data);
    };

    return (
      <Button
        color="primary"
        size="sm"
        onClick={onClick}
        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
      >
          <i className="fas fa-eye"></i>
      </Button>
    );
};

const ViewTransaction = () => {
    const location = useLocation();
    const { transactions = [], loanData = {} } = location.state || {};
    const gridRef = useRef();
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [rowData, setRowData] = useState([]);
    const [filteredRowData, setFilteredRowData] = useState([]);
    const [selectedTxn, setSelectedTxn] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const toggleModal = () => setIsModalOpen(!isModalOpen);
    const navigate = useNavigate();

    const [columnDefs] = useState([
        {
            headerName: 'Trans ID',
            field: 'id',
            sortable: true,
            filter: true,
            width: 120,
        },
        {
            headerName: 'DATE',
            field: 'date',
            sortable: true,
            filter: true,
            width: 120,
        },
        {
            headerName: 'PAYMENT MODE',
            field: 'method',
            sortable: true,
            filter: true,
            width: 140,
        },
        {
            headerName: 'REMARKS',
            field: 'narration',
            sortable: true,
            filter: true,
            flex: 1,
        },
        {
            headerName: 'Paid EMI',
            field: 'paidEMI',
            sortable: true,
            filter: true,
            width: 100,
        },
        {
            headerName: 'GL Head',
            field: 'glHead',
            sortable: true,
            filter: true,
            flex: 1,
        },
        {
            headerName: 'STATUS',
            field: 'status',
            sortable: true,
            filter: true,
            width: 120,
        },
        {
            headerName: 'Amount',
            field: 'amount',
            sortable: true,
            filter: true,
            width: 120,
            valueFormatter: (params) => {
                const value = parseFloat(params.value);
                return !isNaN(value) ? `₹${value.toFixed(2)}` : '₹0.00';
            },
        },
        {
            headerName: 'Type',
            field: 'type',
            sortable: true,
            filter: true,
            width: 100,
            cellRenderer: (params) => (
              <span className={`badge ${params.value === 'credit' ? 'bg-success' : 'bg-danger'}`}>
                    {params.value.toUpperCase()}
                </span>
            ),
        },
        {
            headerName: 'Action',
            field: 'action',
            width: 100,
            cellRenderer: ActionButtonRenderer,
            cellRendererParams: {
                onActionClick: (data) => {
                    setSelectedTxn(data);
                    setIsModalOpen(true);
                },
            },
            suppressMenu: true,
            sortable: false,
            filter: false,
            pinned: 'right',
        },
    ]);

    useEffect(() => {
        if (transactions && Array.isArray(transactions)) {
            const transformedData = transactions.map((transaction, index) => {
                let amount = 0;

                if (transaction.type === 'credit') {
                    const principlePaid = parseFloat(transaction.principle) || 0;
                    const interestPaid = parseFloat(transaction.interest) || 0;
                    amount = principlePaid + interestPaid;
                } else if (transaction.type === 'debit') {
                    amount = parseFloat(transaction.amount) || 0;
                }

                return {
                    id: transaction.id || index + 1,
                    date: transaction.entryDate || transaction.createdAt?.split('T')[0] || '',
                    method: transaction.method || 'N/A',
                    narration: transaction.narration || '',
                    glHead: transaction.glHead || 'N/A',
                    paidEMI: transaction.paidEMI != null ? transaction.paidEMI : 'N/A',
                    status: transaction.status || loanData.status || 'Active',
                    amount,
                    type: transaction.type || '',
                    raw: transaction,
                };
            });

            setRowData(transformedData);
            setFilteredRowData(transformedData);
        }
    }, [transactions, loanData.status]);

    const filterTransactions = () => {
        let filtered = [...rowData];
        if (searchTerm) {
            filtered = filtered.filter((t) =>
              (t.narration && t.narration.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (t.id && t.id.toString().includes(searchTerm))
            );
        }
        if (fromDate && toDate) {
            const startDate = new Date(fromDate);
            const endDate = new Date(toDate);
            filtered = filtered.filter((t) => {
                const d = new Date(t.date);
                return d >= startDate && d <= endDate;
            });
        }
        if (fromAmount !== '' && toAmount !== '') {
            const min = parseFloat(fromAmount);
            const max = parseFloat(toAmount);
            filtered = filtered.filter((t) => {
                const amt = parseFloat(t.amount);
                return amt >= min && amt <= max;
            });
        }
        setFilteredRowData(filtered);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFromDate('');
        setToDate('');
        setFromAmount('');
        setToAmount('');
        setFilteredRowData(rowData);
    };

    const onBtnExport = () => {
        if (gridRef.current?.api) {
            gridRef.current.api.exportDataAsCsv({
                fileName: `transactions_${loanData?.loanNo || 'data'}.csv`,
                columnKeys: ['id', 'date', 'method', 'narration', 'paidEMI', 'glHead', 'status', 'amount', 'type'],
            });
        }
    };

    const onGridReady = (params) => {
        params.api.sizeColumnsToFit();
        const handleResize = () => {
            clearTimeout(window.resizeTimeout);
            window.resizeTimeout = setTimeout(() => {
                params.api.sizeColumnsToFit();
            }, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(window.resizeTimeout);
        };
    };

    const cardHeaderStyle = {
        height: "32px",
        paddingTop: "0",
        paddingBottom: "0",
        display: "flex",
        alignItems: "center"
    };

    const cardTitleStyle = {
        fontSize:16,
        marginLeft:15,
        fontWeight:400
    }

    return (
      <div className="content" style={{ padding: '2rem' }}>
          {/* Loan Info */}
          <Row className="mb-4">
              <Col md="12">
                  <Card className="shadow-lg border-0">
                      <CardHeader className="text-white d-flex justify-content-between align-items-center">
                          <CardTitle tag="h4" className="mb-0" style={cardTitleStyle}>Loan Details</CardTitle>
                          <Button
                            color="light"
                            onClick={() => navigate(-1)}
                            className="btn-round btn-xs"
                          >
                              Back
                          </Button>
                      </CardHeader>

                      <CardBody>
                          <Row>
                              <Col md="6">
                                  <Table borderless size="sm">
                                      <tbody>
                                      <tr>
                                          <td><strong>Loan Number:</strong></td>
                                          <td>{loanData?.loanNo || 'N/A'}</td>
                                      </tr>
                                      <tr>
                                          <td><strong>Member Name:</strong></td>
                                          <td>{loanData?.memberName || 'N/A'}</td>
                                      </tr>
                                      </tbody>
                                  </Table>
                              </Col>
                              <Col md="6">
                                  <Table borderless size="sm">
                                      <tbody>
                                      <tr>
                                          <td><strong>Loan Amount:</strong></td>
                                          <td>₹{loanData?.loanAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</td>
                                      </tr>
                                      <tr>
                                          <td><strong>Current Debt:</strong></td>
                                          <td>₹{loanData?.currentDebt?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</td>
                                      </tr>
                                      </tbody>
                                  </Table>
                              </Col>
                          </Row>
                      </CardBody>
                  </Card>
              </Col>
          </Row>

          {/* Filter Section */}
          <Row className="mb-4">
              <Col md="12">
                  <Card className="shadow-lg border-0">
                      <CardHeader className="bg-light" style={cardHeaderStyle}>
                          <CardTitle tag="h5" className="mb-0" style={cardTitleStyle}>Search Transactions</CardTitle>
                      </CardHeader>
                      <CardBody>
                          <Row>
                              <Col md="3">
                                  <FormGroup>
                                      <Label>Search Trans Id/Narration:</Label>
                                      <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                  </FormGroup>
                              </Col>
                              <Col md="3">
                                  <FormGroup>
                                      <Label>Transaction Date From:</Label>
                                      <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                                  </FormGroup>
                              </Col>
                              <Col md="3">
                                  <FormGroup>
                                      <Label>Transaction Date To:</Label>
                                      <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                                  </FormGroup>
                              </Col>
                              <Col md="3">
                                  <FormGroup>
                                      <Label>From Amount:</Label>
                                      <Input type="number" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} />
                                  </FormGroup>
                              </Col>
                              <Col md="3">
                                  <FormGroup>
                                      <Label>To Amount:</Label>
                                      <Input type="number" value={toAmount} onChange={(e) => setToAmount(e.target.value)} />
                                  </FormGroup>
                              </Col>
                          </Row>
                          <Row className="mt-3">
                              <Col md="auto">
                                  <Button color="success" onClick={filterTransactions} className="me-2">
                                      <i className="fas fa-search me-1"></i> Search
                                  </Button>
                                  <Button color="danger" onClick={clearFilters} className="me-2">
                                      <i className="fas fa-eraser me-1"></i> Clear Form
                                  </Button>
                              </Col>
                          </Row>
                      </CardBody>
                  </Card>
              </Col>
          </Row>

          {/* AG Grid Section */}
          <Row>
              <Col md="12">
                  <Card className="shadow-lg border-0">
                      <CardHeader className="bg-light d-flex justify-content-between align-items-center py-1">
                          <CardTitle tag="h5" className="mb-0" style={{fontSize:16,marginLeft:15,fontWeight:400 }}>Transactions</CardTitle>
                          <Button color="info" size="sm" onClick={onBtnExport}>
                              <i className="fas fa-download me-1"></i> Export CSV
                          </Button>
                      </CardHeader>
                      <CardBody>
                          {filteredRowData.length === 0 ? (
                            <p className="text-center text-muted">
                                {rowData.length === 0 ? "No transaction data available." : "No matching transactions found."}
                            </p>
                          ) : null}
                          <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
                              <AgGridReact
                                ref={gridRef}
                                rowData={filteredRowData}
                                columnDefs={columnDefs}
                                defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                pagination={true}
                                paginationPageSize={10}
                                onGridReady={onGridReady}
                                enableCellTextSelection={true}
                              />
                          </div>
                      </CardBody>
                  </Card>
              </Col>
          </Row>

          {/* Transaction Detail Modal */}
          {selectedTxn && (
            <Modal isOpen={isModalOpen} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Transaction Details</ModalHeader>
                <ModalBody>
                    <Table responsive>
                        <tbody>
                        <tr>
                            <td><strong>Transaction ID</strong></td>
                            <td>{selectedTxn.id}</td>
                        </tr>
                        <tr>
                            <td><strong>Date</strong></td>
                            <td>{new Date(selectedTxn.date).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                            <td><strong>Method</strong></td>
                            <td>{selectedTxn.method}</td>
                        </tr>
                        <tr>
                            <td><strong>Narration</strong></td>
                            <td>{selectedTxn.narration}</td>
                        </tr>
                        <tr>
                            <td><strong>GL Head</strong></td>
                            <td>{selectedTxn.glHead}</td>
                        </tr>
                        {selectedTxn.paidEMI !== 'N/A' && (
                          <tr>
                              <td><strong>Paid EMI</strong></td>
                              <td>{selectedTxn.paidEMI}</td>
                          </tr>
                        )}
                        <tr>
                            <td><strong>Status</strong></td>
                            <td>{selectedTxn.status}</td>
                        </tr>
                        <tr>
                            <td><strong>Amount</strong></td>
                            <td>₹{parseFloat(selectedTxn.amount).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td><strong>Type</strong></td>
                            <td>{selectedTxn.type.toUpperCase()}</td>
                        </tr>
                        </tbody>
                    </Table>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleModal}>Close</Button>
                </ModalFooter>
            </Modal>
          )}
      </div>
    );
};

export default ViewTransaction;
