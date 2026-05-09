import { Injectable } from '@angular/core';
import { Mantenimiento } from '../models/mantenimiento.model';

@Injectable({
  providedIn: 'root'
})
export class MantenimientoStateService {
  private savedState: {
    currentRecord: Mantenimiento;
    pendingRecords: Mantenimiento[];
    isEditing: boolean;
    showModal: boolean;
  } | null = null;

  saveState(state: {
    currentRecord: Mantenimiento;
    pendingRecords: Mantenimiento[];
    isEditing: boolean;
    showModal: boolean;
  }) {
    this.savedState = state;
  }

  getSavedState() {
    return this.savedState;
  }

  clearState() {
    this.savedState = null;
  }
}
