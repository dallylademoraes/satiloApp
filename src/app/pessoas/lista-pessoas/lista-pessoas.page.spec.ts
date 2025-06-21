import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaPessoasPage } from './lista-pessoas.page';

describe('ListaPessoasPage', () => {
  let component: ListaPessoasPage;
  let fixture: ComponentFixture<ListaPessoasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListaPessoasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
