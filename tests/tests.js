const chai = require('chai')
const { afterEach, beforeEach, describe, it } = require('mocha')
const employee = require('./employee')
const products = require('./products')
const pricing = require('../pricing')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.use(sinonChai)
const { expect } = chai

describe('formatPrice', () => {
  it('returns the price with two decimal places when a whole number is provided', () => {
    const formattedPrice = pricing.formatPrice(15)
    expect(formattedPrice).to.equal(15.00)
  })
  it('returns the price given, truncated to two decimal places', () => {
    const formattedPrice = pricing.formatPrice(15.355)
    expect(formattedPrice).to.equal(15.35)
  })
})

describe('getEmployerContribution', () => {

  it('returns the contribution amount from the product when the contribution type is dollars', () => {
    const contribution = pricing.getEmployerContribution(products.longTermDisability.employerContribution, 15.33)
    expect(contribution).to.equal(10)
  })
  it('returns the calculated contribution(percent of price) when the contribution type is a percentage', () => {
    const contribution = pricing.getEmployerContribution(products.voluntaryLife.employerContribution, 15)
    expect(contribution).to.equal(1.5)
  })
})

describe('calculateVolLifePricePerRole', () => {

  it('returns the price of vol life coverage for a particular role(ee) ', () => {
    const coverageLevel = [{ role: 'ee', coverage: 125000 }]
    const price = pricing.calculateVolLifePricePerRole('ee', coverageLevel, products.voluntaryLife.costs)
    expect(price).to.equal(43.75)
  })
})
describe('calculateVolLifePrice', () => {
  it('returns the price(pre employer contribution) for vol life product based on user selection', () => {
    const selectedOptions = {
      familyMembersToCover: ['ee', 'sp'],
      coverageLevel: [
        { role: 'ee', coverage: 200000 },
        { role: 'sp', coverage: 75000 },
      ],
    }
    const price = pricing.calculateVolLifePrice(products.voluntaryLife, selectedOptions)
    expect(price).to.equal(79)
  })
  it('returns the price (pre employer contribution) for vol life product for ee and sp', () => {
    const selectedOptions = {
      familyMembersToCover: ['ee', 'sp'],
      coverageLevel: [
        { role: 'ee', coverage: 200000 },
        { role: 'sp', coverage: 75000 },
      ],
    }
    const price = pricing.calculateVolLifePrice(products.voluntaryLife, selectedOptions)
    expect(price).to.equal(79)
  })
})

describe('calculateLTDPrice', () => {
  it('return the price of ltd if the person role is ee', () => {
    const selectedOptions = {
      familyMembersToCover: ['ee'],
      coverageLevel: [{ role: 'ee', coverage: 125000 }]
    }
    const price = pricing.calculateLTDPrice(
      products.longTermDisability,
      employee,
      selectedOptions
    )
    expect(price).to.equal(32.04)
  })
  it('returns 0 if the role is not ee', () => {
    const selectedOptions = {
      familyMembersToCover: ['pa']
    }
    const price = pricing.calculateLTDPrice(
      products.longTermDisability,
      employee,
      selectedOptions
    )
    expect(price).to.equal(0)
  })
})

describe('calculateCommuterCost', () => {
  it('returns the price of selected(parking) commuter product without employer contribution', () => {
    const selectedOptions = { benefits: 'parking' }
    const price = pricing.calculateCommuterCost(products.commuter, selectedOptions)
    expect(price).to.equal(250)
  })
  it('returns the price of selected(train) commuter product without employer contribution', () => {
    const selectedOptions = { benefits: 'train' }
    const price = pricing.calculateCommuterCost(products.commuter, selectedOptions)
    expect(price).to.equal(84.75)
  })
})

describe('calculateProductPrice', () => {
  let sandbox
  let formatPriceSpy
  let getEmployerContributionSpy
  let calculateVolLifePricePerRoleSpy
  let calculateVolLifePriceSpy
  let calculateLTDPriceSpy
  let calculateCommuterCostSpy

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    formatPriceSpy = sandbox.spy(pricing, 'formatPrice')
    getEmployerContributionSpy = sandbox.spy(pricing, 'getEmployerContribution')
    calculateVolLifePricePerRoleSpy = sandbox.spy(pricing, 'calculateVolLifePricePerRole')
    calculateVolLifePriceSpy = sandbox.spy(pricing, 'calculateVolLifePrice')
    calculateLTDPriceSpy = sandbox.spy(pricing, 'calculateLTDPrice')
    calculateCommuterCostSpy = sandbox.spy(pricing, 'calculateCommuterCost')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('returns the price of selected(parking) commuter product with contribution', () => {
    const selectedOptions = { benefits: 'parking' }
    const price = pricing.calculateProductPrice(products.commuter, selectedOptions)
    expect(price).to.equal(175)
    expect(formatPriceSpy).to.have.callCount(1)
    expect(getEmployerContributionSpy).to.have.callCount(1)
    expect(calculateCommuterCostSpy).to.have.callCount(1)
  })
  it('returns the price of selected(train) commuter product with employer contribution', () => {
    const selectedOptions = { benefits: 'train' }
    const price = pricing.calculateProductPrice(products.commuter, selectedOptions)
    expect(price).to.equal(9.75)
    expect(formatPriceSpy).to.have.callCount(1)
    expect(getEmployerContributionSpy).to.have.callCount(1)
    expect(calculateCommuterCostSpy).to.have.callCount(1)
  })

  it('returns the price for a voluntary life product for a single employee', () => {
    const selectedOptions = {
      familyMembersToCover: ['ee'],
      coverageLevel: [{ role: 'ee', coverage: 125000 }],
    }
    const price = pricing.calculateProductPrice(products.voluntaryLife, employee, selectedOptions)
    expect(price).to.equal(39.37)
    expect(calculateVolLifePriceSpy).to.have.callCount(1)
    expect(getEmployerContributionSpy).to.have.callCount(1)
    expect(calculateVolLifePricePerRoleSpy).to.have.callCount(1)
    expect(formatPriceSpy).to.have.callCount(1)
  })
  it('returns the price for a voluntary life product for an employee with a spouse', () => {
    const selectedOptions = {
      familyMembersToCover: ['ee', 'sp'],
      coverageLevel: [
        { role: 'ee', coverage: 200000 },
        { role: 'sp', coverage: 75000 },
      ],
    }
    const price = pricing.calculateProductPrice(products.voluntaryLife, employee, selectedOptions)
    expect(price).to.equal(71.09)
    expect(calculateVolLifePriceSpy).to.have.callCount(1)
    expect(getEmployerContributionSpy).to.have.callCount(1)
    expect(calculateVolLifePricePerRoleSpy).to.have.callCount(2)
    expect(formatPriceSpy).to.have.callCount(1)
  })
  it('returns the price for a disability product for an employee', () => {
    const selectedOptions = {
      familyMembersToCover: ['ee']
    }
    const price = pricing.calculateProductPrice(products.longTermDisability, employee, selectedOptions)
    expect(price).to.equal(22.04)
    expect(calculateLTDPriceSpy).to.have.callCount(1)
    expect(getEmployerContributionSpy).to.have.callCount(1)
    expect(formatPriceSpy).to.have.callCount(1)
  })
  it('throws an error on unknown product type', () => {
    const unknownProduct = { type: 'vision' }
    expect(() => pricing.calculateProductPrice(unknownProduct, {}, {})).to.throw('Unknown product type: vision')
  })
})