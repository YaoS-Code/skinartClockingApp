// src/components/admin/RecordsSummary.jsx
import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import {
  Container,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { format, addDays, endOfMonth, isValid, parse } from 'date-fns';
import api from '../../services/api';
import { getInitialDateRange } from '../../utils/dateUtils';

function RecordsSummary() {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [filters, setFilters] = useState(() => ({
    location: 'all',
    ...getInitialDateRange()
  }));

  useEffect(() => {
    // Update date range when component mounts
    setFilters(prev => ({
      ...prev,
      ...getInitialDateRange()
    }));
  }, []);

  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'MMC', label: 'MMC' },
    { value: 'SkinartMD', label: 'SkinartMD' },
    { value: 'RAAC', label: 'RAAC' },
    { value: 'Remote', label: 'Remote' },
    { value: 'Other', label: 'Other' }
  ];

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Format dates for API - backend will handle the time range
      const params = {
        start_date: filters.start_date, // Format: YYYY-MM-DD
        end_date: filters.end_date,     // Format: YYYY-MM-DD
        ...(filters.location !== 'all' && { location: filters.location })
      };

      console.log('Fetching summary with params:', params);
      const response = await api.get('/admin/records/summary', { params });
      console.log('Summary response:', response.data);
      console.log('Response data length:', response.data?.length);

      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response data format:', response.data);
        setError('Invalid data format received from server');
        setSummaryData([]);
        return;
      }

      if (response.data.length === 0) {
        console.log('No records found for the selected date range');
        setSummaryData([]);
        return;
      }

      const groupedData = response.data.reduce((users, record) => {
        if (!record.user_id) {
          console.warn('Record missing user_id:', record);
          return users;
        }

        if (!users[record.user_id]) {
          users[record.user_id] = {
            user_id: record.user_id,
            username: record.username || 'Unknown',
            full_name: record.full_name || 'Unknown',
            total_hours: 0,
            total_records: 0,
            locations: {},
            first_clock_in: record.first_clock_in,
            last_clock_out: record.last_clock_out,
          };
        }

        const location = record.location || 'Unspecified';
        if (!users[record.user_id].locations[location]) {
          users[record.user_id].locations[location] = {
            total_hours: 0,
            records: [],
          };
        }

        users[record.user_id].locations[location].records.push({
          id: record.record_id,
          clock_in: record.clock_in,
          clock_out: record.clock_out,
          break_minutes: record.break_minutes || 30,
          individual_hours: parseFloat(record.individual_hours || 0),
          location: location
        });

        users[record.user_id].locations[location].total_hours +=
          parseFloat(record.individual_hours || 0);

        users[record.user_id].total_hours += parseFloat(record.individual_hours || 0);
        users[record.user_id].total_records += 1;

        return users;
      }, {});

      const groupedArray = Object.values(groupedData);
      console.log('Grouped data:', groupedArray);
      console.log('Grouped data length:', groupedArray.length);
      setSummaryData(groupedArray);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               'Failed to fetch summary data');
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleEditClick = (clockRecord, userId, location) => {
    console.log('Editing record:', { clockRecord, userId, location });

    if (!clockRecord.id) {
      setSnackbar({
        open: true,
        message: 'Record ID not found',
        severity: 'error'
      });
      return;
    }

    // Database stores local Vancouver time, use as-is for editing
    const formattedClockIn = clockRecord.clock_in ?
      moment(clockRecord.clock_in).format('YYYY-MM-DDTHH:mm') : '';
    const formattedClockOut = clockRecord.clock_out ?
      moment(clockRecord.clock_out).format('YYYY-MM-DDTHH:mm') : '';

    setEditingRecord({
      ...clockRecord,
      clock_in: formattedClockIn,
      clock_out: formattedClockOut,
      user_id: userId,
      location: location
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      // Convert date-time format from 'YYYY-MM-DDTHH:mm' to 'YYYY-MM-DD HH:mm:ss' (keep local time)
      const formatDateTimeForBackend = (dateTimeStr) => {
        if (!dateTimeStr) return null;
        const parsed = moment(dateTimeStr);
        if (!parsed.isValid()) return null;
        // Keep as local Vancouver time for database storage
        return parsed.format('YYYY-MM-DD HH:mm:ss');
      };

      const payload = {
        clock_in: formatDateTimeForBackend(editingRecord.clock_in),
        clock_out: editingRecord.clock_out ? formatDateTimeForBackend(editingRecord.clock_out) : null,
        location: editingRecord.location,
        break_minutes: editingRecord.break_minutes || 30,
        notes: 'Modified by admin'
      };

      if (!payload.clock_in) {
        setSnackbar({
          open: true,
          message: 'Invalid clock in time',
          severity: 'error'
        });
        return;
      }

      await api.put(`/admin/records/${editingRecord.id}`, payload);

      setSnackbar({
        open: true,
        message: 'Record updated successfully',
        severity: 'success'
      });

      setEditDialogOpen(false);
      fetchSummary();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to update record',
        severity: 'error'
      });
    }
  };

  const handleDateChange = (field, value) => {
    // 允许空值，重置为初始日期
    if (!value) {
      setFilters(prev => ({
        ...prev,
        [field]: getInitialDateRange()[field]
      }));
      return;
    }

    // 尝试解析日期
    const parsedDate = parse(value, 'yyyy-MM-dd', new Date());

    // 如果是有效日期，更新状态
    if (isValid(parsedDate)) {
      setFilters(prev => ({
        ...prev,
        [field]: format(parsedDate, 'yyyy-MM-dd')
      }));
    }
  };

  const handleEditDateTimeChange = (field, value) => {
    // 允许空值
    if (!value) {
      setEditingRecord(prev => ({
        ...prev,
        [field]: ''
      }));
      return;
    }

    // 尝试解析日期时间
    const parsedDate = moment(value, 'YYYY-MM-DD HH:mm');

    // 如果是有效日期时间，更新状态
    if (parsedDate.isValid()) {
      setEditingRecord(prev => ({
        ...prev,
        [field]: parsedDate.format('YYYY-MM-DDTHH:mm')
      }));
    }
  };

  const EditRecordDialog = () => (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Clock Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <DateTimePicker
                label="Clock In"
                value={editingRecord?.clock_in ? moment(editingRecord.clock_in) : null}
                onChange={(newValue) => {
                  setEditingRecord({
                    ...editingRecord,
                    clock_in: newValue ? newValue.format('YYYY-MM-DDTHH:mm') : ''
                  });
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputLabelProps: { shrink: true }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <DateTimePicker
                label="Clock Out"
                value={editingRecord?.clock_out ? moment(editingRecord.clock_out) : null}
                onChange={(newValue) => {
                  setEditingRecord({
                    ...editingRecord,
                    clock_out: newValue ? newValue.format('YYYY-MM-DDTHH:mm') : ''
                  });
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputLabelProps: { shrink: true }
                  }
                }}
              />
            </Grid>
          <Grid item xs={12}>
            <TextField
              label="Break Minutes"
              type="number"
              value={editingRecord?.break_minutes || 30}
              onChange={(e) => setEditingRecord({
                ...editingRecord,
                break_minutes: Math.max(0, parseInt(e.target.value) || 0)
              })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={editingRecord?.location || ''}
                onChange={(e) => setEditingRecord({
                  ...editingRecord,
                  location: e.target.value
                })}
                label="Location"
              >
                {locations
                  .filter(loc => loc.value !== 'all')
                  .map((loc) => (
                    <MenuItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditDialogOpen(false)} startIcon={<CancelIcon />}>
          Cancel
        </Button>
        <Button onClick={handleSaveEdit} color="primary" startIcon={<SaveIcon />}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
    </LocalizationProvider>
  );

  const formatDuration = (hours) => {
    if (!hours) return '0h 0m';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const formatTotalHours = (hours) => {
    const formatted = Number(hours || 0).toFixed(1);
    return `${formatted} ${formatted === '1.0' ? 'hour' : 'hours'}`;
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return 'Invalid Date';
    // Database stores local Vancouver time, display as-is
    return moment(datetime).format('YYYY-MM-DD HH:mm:ss');
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom component="div">
            Staff Working Hours Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  label="Location"
                >
                  {locations.map((loc) => (
                    <MenuItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Start Date"
                type="text"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                onBlur={(e) => handleDateChange('start_date', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                placeholder="YYYY-MM-DD"
                inputProps={{
                  maxLength: 10
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="End Date"
                type="text"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                onBlur={(e) => handleDateChange('end_date', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                placeholder="YYYY-MM-DD"
                inputProps={{
                  maxLength: 10
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Chip
                label={`Grand Total Hours: ${formatTotalHours(
                  summaryData.reduce((total, user) => total + parseFloat(user.total_hours), 0)
                )}`}
                color="primary"
                sx={{ fontSize: '1rem', py: 2 }}
              />
            </Box>

            {summaryData.map((user) => (
              <Accordion key={user.user_id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{user.full_name} ({user.username})</Typography>
                  <Box sx={{ ml: 2 }}>
                    <Chip
                      label={`Total Hours: ${formatTotalHours(user.total_hours)}`}
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`Records: ${user.total_records}`}
                      color="secondary"
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {Object.entries(user.locations).map(([location, locationData]) => (
                    <Box key={location} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {location}
                        <Chip
                          label={`Location Total: ${formatTotalHours(locationData.total_hours)}`}
                          color="primary"
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Clock In</TableCell>
                              <TableCell>Clock Out</TableCell>
                              <TableCell>Break</TableCell>
                              <TableCell>Hours</TableCell>
                              <TableCell>Location</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {locationData.records.map((record) => (
                              <TableRow key={record.id}>
                                <TableCell>{formatDateTime(record.clock_in)}</TableCell>
                                <TableCell>
                                  {record.clock_out ? formatDateTime(record.clock_out) : 'Still clocked in'}
                                </TableCell>
                                <TableCell>{record.break_minutes} min</TableCell>
                                <TableCell>{Number(record.individual_hours).toFixed(2)}</TableCell>
                                <TableCell>{record.location || 'Unspecified'}</TableCell>
                                <TableCell>
                                  <IconButton
                                    onClick={() => handleEditClick(record, user.user_id, record.location)}
                                    size="small"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Location Total Row */}
                            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                                Location Total
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {formatTotalHours(locationData.total_hours)}
                              </TableCell>
                              <TableCell />
                              <TableCell />
                              <TableCell />
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ))}

                  {/* User Total Summary */}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      User Total Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Location</TableCell>
                                <TableCell align="right">Hours</TableCell>
                                <TableCell align="right">Records</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(user.locations).map(([location, data]) => (
                                <TableRow key={location}>
                                  <TableCell>{location}</TableCell>
                                  <TableCell align="right">
                                    {formatTotalHours(data.total_hours)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {data.records.length}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow sx={{
                                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                fontWeight: 'bold'
                              }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Total All Locations
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                  {formatTotalHours(user.total_hours)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                  {user.total_records}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    </Grid>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}

            {summaryData.length === 0 && (
              <Typography variant="body1" sx={{ textAlign: 'center', mt: 3 }}>
                No records found for the selected period
              </Typography>
            )}
          </>
        )}
      </Paper>

      {/* Edit Dialog */}
      {editingRecord && <EditRecordDialog />}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default RecordsSummary;